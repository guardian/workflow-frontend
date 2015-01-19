package controllers

import javax.ws.rs.PathParam
import models.Response.Response
import com.gu.workflow.db.{CommonDB, Archive}
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import lib.{PostgresDB, StatusDatabase, Formatting, PrototypeConfiguration}
import models._
import play.api.libs.json._
import play.api.mvc._
import com.wordnik.swagger.annotations._
import com.wordnik.swagger.core.util.ScalaJsonUtil

import scala.util.Either


@Api(value = "/content", description = "Operations about content")
object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val sections = queryStringMultiOption(req.getQueryString("section"),
      s => Some(Section(s)))
    val contentType = queryStringMultiOption(req.getQueryString("content-type"))
    val flags = queryStringMultiOption(req.getQueryString("flags"),
      WfQuery.queryStringToFlag.get(_))
    val prodOffice = queryStringMultiOption(req.getQueryString("prodOffice"))
    val createdFrom = req.getQueryString("created.from").flatMap(Formatting.parseDate)
    val createdUntil = req.getQueryString("created.until").flatMap(Formatting.parseDate)
    val status = queryStringMultiOption(req.getQueryString("status"), StatusDatabase.find(_))
    val published = req.getQueryString("state").map(_ == "published")
    val text = req.getQueryString("text")
    val assignee = queryStringMultiOption(req.getQueryString("assignee"))

    val queryData = WfQuery(
      section       = sections,
      status        = status,
      contentType   = contentType,
      prodOffice    = prodOffice,
      dueTimes      = WfQuery.dateTimeToQueryTime(dueFrom, dueUntil),
      creationTimes = WfQuery.dateTimeToQueryTime(createdFrom, createdUntil),
      flags         = flags,
      published     = published,
      text          = text,
      assignedTo    = assignee
    )
    Response(for{
      content <- PostgresDB.getContentItems(queryData).right
    }yield {
      content
    })

  }

  def content = APIAuthAction(getContentBlock)

  @ApiOperation(
    nickname = "getContentById",
    value = "Find contentItem by ID",
    notes = "Returns a content item",
    response = classOf[models.ContentItem],
    httpMethod = "GET"
  )
  @ApiResponses(Array(
    new ApiResponse(code = 404, message = "ContentNotFound")
  ))
  def contentById(@ApiParam(value = "ID of the content item to fetch") @PathParam("id") id: Long) = APIAuthAction {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentById(id)

    val contentEither = contentOpt match {
      case Some(contentItem) => Right(contentItem)
      case None => {
        Archive.getArchiveContentForStubId(id) match {
          case Some(c: ArchiveContent) => Left(contentMovedToArchive(c))
          case None => Left(ApiErrors.notFound)
        }
      }
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
        contentItem <- extract[ContentItem](jsValue).right
        stubId <- PostgresDB.createContent(contentItem).right
      } yield {
        stubId
      })
    }
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
