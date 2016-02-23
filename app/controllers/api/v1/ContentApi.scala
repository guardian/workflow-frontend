package controllers

import javax.ws.rs.PathParam
import com.gu.workflow.lib._
import lib._
import Response.Response
import com.gu.workflow.db.{CommonDB}
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import models._
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.mvc._
import com.wordnik.swagger.annotations._
import com.wordnik.swagger.core.util.ScalaJsonUtil
import models.Status
import lib.DBToAPIResponse._

import scala.util.{Try, Either}


@Api(value = "/content", description = "Operations about content")
object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>

    val queryData = RequestParameters.fromRequest(req)

    //Note content items are not UI ordered yet
    NotImplemented
  }

  def content = APIAuthAction { request =>
    NotImplemented
  }

  @ApiOperation(
    nickname = "contentById",
    value = "Get content by either Stub or Composer ID",
    response = classOf[Long],
    httpMethod = "GET"
  )
  @ApiResponses(Array(
    new ApiResponse(code = 404, message = "NotFound")
  ))
  def contentById(
    @ApiParam(value = "ID of the content item to fetch (Stub ID or Composer ID)") @PathParam("id") id: String) =  CORSable(composerUrl) {
    APIAuthAction { request =>
      Try(id.toLong).toOption match {
        case Some(l) => contentByStubId(l)
        case None => contentByComposerId(id)
      }
    }
  }

  def contentByStubId(id: Long): Result =  {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentById(id)

    Response(contentOpt match {
      case Some(contentItem) => Right(ApiSuccess(contentItem))
      case None => Left(ApiErrors.notFound)
    })
  }

  def contentByComposerId(id: String) =  {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentByCompserId(id)

    val contentEither = contentOpt match {
      case Some(contentItem) =>
        contentItem.stub.id.map { id => Right(ApiSuccess(contentItem))}.getOrElse(Left(ApiErrors.notFound))
      case None => Left(ApiErrors.notFound)
    }
		Response(contentEither)
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
        stubId <- upsertContentResponse(PostgresDB.createContent(contentItem.data)).right
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
