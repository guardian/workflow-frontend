package controllers

import javax.ws.rs.PathParam
import com.gu.workflow.lib.{StatusDatabase, Formatting}
import models.Response.Response
import com.gu.workflow.db.{CommonDB, Archive}
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import lib.PostgresDB
import models._
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.mvc._
import com.wordnik.swagger.annotations._
import com.wordnik.swagger.core.util.ScalaJsonUtil
import models.Status

import scala.util.{Try, Either}


@Api(value = "/content", description = "Operations about content")
object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>
    val queryData = WfQuery.fromRequest(req)
    //Note content items are not UI ordered yet
    Response(for{
      content <- PostgresDB.getContentItems(queryData).right
    }yield {
      content
    })

  }

  def content = APIAuthAction(getContentBlock)
  //@ApiParam(value = "ID of the content item to fetch") @PathParam("id")
  def contentById(id: String) = APIAuthAction { request =>
    Try(id.toLong).toOption match {
      case Some(l) => contentByStubId(l)
      case None => contentByComposerId(id)
    }
  }

  def contentByStubId(id: Long): Result =  {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentById(id)

    Response(contentOpt match {
      case Some(contentItem) => Right(ApiSuccess(contentItem))
      case None => {
        Archive.getArchiveContentForStubId(id) match {
          case Some(c: ArchiveContent) => Left(contentMovedToArchive(c))
          case None => Left(ApiErrors.notFound)
        }
      }
    })
  }



  def contentByComposerId(id: String) =  {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentByCompserId(id)

    contentOpt match {
      case Some(contentItem) => {
        Response(contentItem.stub.id.map { id =>
          Right(ApiSuccess(contentItem,
                status = "Redirect",
                statusCode = 301,
                headers = List(("location", s"/api/v1/content/${id}"))))
        }.getOrElse(Left(ApiErrors.notFound)))
      }
      case None => {
        Response(Archive.getArchiveContentForComposerId(id) match {
          case Some(c: ArchiveContent) => Left(contentMovedToArchive(c))
          case None => Left(ApiErrors.notFound)
        })
      }
    }
  }

  @ApiOperation(
    nickname = "createContentItem",
    value = "Create new content item",
    response = classOf[Long],
    httpMethod = "POST"
  )
  @ApiResponses(Array(
    new ApiResponse(code = 409, message = "Conflict"),
    new ApiResponse(code = 400, message = "InvalidContentType"),
    new ApiResponse(code = 400, message = "JsonParseError")
  ))
  @ApiImplicitParams(Array(
    new ApiImplicitParam(value = "Content object", required = true, dataType = "ContentItem", paramType = "body")))
  def createContent() = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequest(request.body).right
        contentItem <- extract[ContentItem](jsValue.data).right
        stubId <- PostgresDB.createContent(contentItem.data).right
      } yield {
        stubId
      })
    }
  }

  def modifyContent(id: Long) = Action {
    NotImplemented
  }

  @ApiOperation(
    nickname = "deleteContentItem",
    value = "Delete new content item",
    response = classOf[Long],
    httpMethod = "DELETE"
  )
  @ApiResponses(Array(
    new ApiResponse(code = 404, message = "ContentNotFound")
  ))
  def deleteContent(@ApiParam(value = "ID of the content item to delete") @PathParam("id") id: Long) = {
    APIAuthAction { implicit request =>
      Response(for {
        stubId <- PostgresDB.deleteStub(id).right
      }yield stubId)
    }
  }
}
