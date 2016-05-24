package com.gu.workflow.api

import com.gu.workflow.lib.Config
import play.api.libs.ws.{WS, WSRequestHolder, WSResponse}
import play.api.mvc.AnyContent
import play.api.Play.current

import scala.concurrent.Future
import models.api._
import play.api.libs.json._

object ApiUtils {
  lazy val apiRoot: String = Config.getConfigStringOrFail("api.url")

  def buildRequest(path: String): WSRequestHolder = WS.url(s"${apiRoot}/${path}")
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

  def extractDataResponse[A: Reads](jsValue: JsValue): ApiResponseFt[A] = {
    val data = (jsValue \ "data")
    extractResponse[A](data)
  }

  def extractResponse[A: Reads](jsValue: JsValue): ApiResponseFt[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => ApiResponseFt.Right(a)
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        ApiResponseFt.Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }

  def errorMsgs(error: JsError) =
    (for ((path, msgs) <- error.errors; msg <- msgs)
    yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")

}
