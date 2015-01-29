package controllers

import javax.ws.rs.PathParam
import models.Response.Response
import com.gu.workflow.db.CommonDB
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import lib.{PostgresDB, PrototypeConfiguration}
import models._
import play.api.libs.json._
import play.api.mvc._

import scala.util.Either

trait WorkflowApi {
  val composerUrl = PrototypeConfiguration.apply.composerUrl
  val apiBaseUrl  = "/api/v1/"

  def contentMovedToArchive(c: ArchiveContent) =
    ApiError("ContentMovedToArchive", "Content has been moved to archive", 404, "archived",
      Some(
        JsObject(
          "archive" -> JsObject(
            "uri" -> JsString(s"${apiBaseUrl}archive/${c.stubId}") ::
            "data" -> Json.toJson(c) ::
            Nil
          ) ::
          Nil
        )
      )
    )

  def allowCORSAccess(methods: String, args: Any*) = CORSable(composerUrl) {
    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }

  def queryStringMultiOption[A](param: Option[String],
                                // default transformer just makes
                                // Option using Sum.apply
                                f: String => Option[A] = (s: String) => Some(s)): List[A] =
  // conver the query string into a list of filters by separating on
  // "," and pass to the transformation function to get the required
  // type. If the param doesn't exist in the query string, assume
  // the empty list
    param map {
      _.split(",").toList.map(f).collect { case Some(a) => a }
    } getOrElse Nil

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  def readJsonFromRequest(requestBody: AnyContent):  models.Response.Response[JsValue] = {
    requestBody.asJson match {
      case Some(jsValue) => Right(ApiSuccess(data=jsValue))
      case None => Left(ApiErrors.invalidContentSend)
    }
  }

  /* JsError's may contain a number of different errors for differnt
   * paths. This will aggregate them into a single string */
  def errorMsgs(error: JsError) =
    (for ((path, msgs) <- error.errors; msg <- msgs)
    yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  def  extract[A: Reads](jsValue: JsValue): models.Response.Response[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(ApiSuccess(a))
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left(ApiErrors.jsonParseError(errMsg.toString))
    }
  }
}
