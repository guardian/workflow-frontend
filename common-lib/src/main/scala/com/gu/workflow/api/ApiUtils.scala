package com.gu.workflow.api

import com.gu.workflow.lib.Config
import models.Stub
import models.Stub.{flatJsonReads, stubWrites}
import models.api._
import play.api.Logger
import play.api.Play.current
import play.api.libs.json._
import play.api.libs.ws.{WS, WSRequest, WSResponse}
import play.api.mvc.AnyContent

import scala.concurrent.Future

object ApiUtils {
  lazy val apiRoot: String = Config.getConfigStringOrFail("api.url")

  def buildRequest(path: String): WSRequest = WS.url(s"$apiRoot/$path")

  def deleteRequest(path: String): Future[WSResponse] =
    buildRequest(path).delete()

  def postRequest(path: String, data: JsValue = JsNull): Future[WSResponse] =
    buildRequest(path).withHeaders("content-type" -> "application/json").post(data)

  def putRequest(path: String, data: JsValue = JsNull): Future[WSResponse] =
    buildRequest(path).withHeaders("content-type" -> "application/json").put(data)

  def getRequest(path: String, params: Option[Seq[(String, String)]] = None):
      Future[WSResponse] =
    if(params.isDefined) {
      buildRequest(path).withQueryString(params.get.toList: _*).get()
    } else buildRequest(path).get()

  def readJsonFromRequestResponse(requestBody: AnyContent): ApiResponseFt[JsValue] = {
    requestBody.asJson match {
      case Some(jsValue) => ApiResponseFt.Right(jsValue)
      case None => ApiResponseFt.Left(ApiError("InvalidContentType", "could not read json from the request", 400, "badrequest"))
    }
  }

  // this function is needed to convert the json into a format that datastore understands.
  def flatStubJsonToStubJson(jsValue: JsValue): ApiResponseFt[JsValue] = {
    jsValue.validate[Stub](flatJsonReads).fold(e => {
      ApiResponseFt.Left(ApiError("Json conversion failed", s"Failed to convert flat stub into stub with externalData level for datastore with error: $e. Json: $jsValue", 400, "badrequest"))
    }, s => ApiResponseFt.Right(Json.toJson(s)(stubWrites)))
  }

  def flatStubJsonToStubWithCollaboratorsJson(jsValue: JsValue): ApiResponseFt[JsValue] = {
    (jsValue \ "stub").validate[Stub](flatJsonReads).fold(e => {
      ApiResponseFt.Left(ApiError("Json conversion failed", s"Failed to convert flat stub from StubWithCollaborators into stub with externalData level for datastore with error: $e", 400, "badrequest"))
    }, s => ApiResponseFt.Right(Json.parse(s"""{ "stub": ${Json.toJson(s)(stubWrites)}, "collaborators": [] }"""))
    )
  }

  def extractDataResponse[A: Reads](jsValue: JsValue): ApiResponseFt[A] = {
    val data = jsValue \ "data"
    extractResponse[A](data)
  }

  def extractDataResponseOpt[A: Reads](jsValue: JsValue): ApiResponseFt[Option[A]] = {
    val data = (jsValue \ "data").toOption
    ApiResponseFt.Right(data.flatMap(_.asOpt[A]))
  }

  def extractResponse[A: Reads](jsValue: JsLookupResult): ApiResponseFt[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => ApiResponseFt.Right(a)
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Logger.error(s"JsonParseError failed to parse the json. Error(s): $errMsg 400 badrequest. Json: $jsValue")
        ApiResponseFt.Left(ApiError("JsonParseError", s"failed to parse the json. Error(s): $errMsg. Json: $jsValue", 400, "badrequest"))
    }
  }

  def errorMsgs(error: JsError): String =
    (for ((path, msgs) <- error.errors; msg <- msgs)
    yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")

}
