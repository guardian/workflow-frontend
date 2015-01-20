package controllers

import javax.ws.rs.PathParam
import models.Response.Response
import com.gu.workflow.db.{CommonDB, Archive}
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import lib.{PostgresDB, PrototypeConfiguration}
import models._
import play.api.libs.json._
import play.api.mvc._
import com.wordnik.swagger.annotations._
import com.wordnik.swagger.core.util.ScalaJsonUtil

import scala.util.Either

@Api(value = "/archive", description = "Operations about archived content")
object ArchiveApi extends Controller with PanDomainAuthActions with WorkflowApi {

  @ApiOperation(
    nickname = "getContentById",
    value = "Find archived contentItem by ID",
    notes = "Returns an archived content item",
    response = classOf[models.ArchiveContent],
    httpMethod = "GET"
  )
  @ApiResponses(Array(
    new ApiResponse(code = 404, message = "ContentNotFound")
  ))
  def contentById(@ApiParam(value = "ID of the content item to fetch") @PathParam("id") id: Long) = APIAuthAction {
    Response(
      Archive.getArchiveContentForStubId(id) match {
        case Some(c: ArchiveContent) => Right(c)
        case None => Left(ApiErrors.notFound)
      }
    )
  }
}
