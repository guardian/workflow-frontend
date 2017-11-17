package com.gu.workflow.api

import com.gu.workflow.lib.Config
import io.circe.syntax._
import io.circe.{Decoder, Json, parser}
import models.Stub
import models.Stub.flatJsonDecoder
import models.api._
import play.api.Play.current
import play.api.libs.ws.{WS, WSRequest, WSResponse}
import play.api.mvc.AnyContent

import scala.concurrent.Future

object ApiUtils {
  lazy val apiRoot: String = Config.getConfigStringOrFail("api.url")

  def buildRequest(path: String): WSRequest = WS.url(s"$apiRoot/$path")

  def deleteRequest(path: String): Future[WSResponse] =
    buildRequest(path).delete()

  def postRequest(path: String, data: Json = Json.Null): Future[WSResponse] =
    buildRequest(path).withHeaders("content-type" -> "application/json").post(data.toString())

  def putRequest(path: String, data: Json = Json.Null): Future[WSResponse] =
    buildRequest(path).withHeaders("content-type" -> "application/json").put(data.toString())

  def getRequest(path: String, params: Option[Seq[(String, String)]] = None):
      Future[WSResponse] =
    if(params.isDefined) {
      buildRequest(path).withQueryString(params.get.toList: _*).get()
    } else buildRequest(path).get()

  def readJsonFromRequestResponse(requestBody: AnyContent): ApiResponseFt[Json] = requestBody.asJson.map(_.toString) match {
    case Some(str) =>
      parser.parse(str).fold(
        err => ApiResponseFt.Left(ApiError.jsonParseError(err.message, str)),
        json => ApiResponseFt.Right(json))
    case None => ApiResponseFt.Left(ApiError.invalidContentSend)
  }

  // this function is needed to convert the json into a format that datastore understands.
  def flatStubJsonToStubJson(json: Json): ApiResponseFt[Json] = {
    json.as[Stub](flatJsonDecoder).fold(err => {
      ApiResponseFt.Left(ApiError.jsonParseError(err.message, json.noSpaces))
    }, s => ApiResponseFt.Right(s.asJson))
  }

  def flatStubJsonToStubWithCollaboratorsJson(json: Json): ApiResponseFt[Json] = {
    json.hcursor.downField("stub").as[Stub](flatJsonDecoder).fold(err => {
      ApiResponseFt.Left(ApiError.jsonParseError(err.message, json.noSpaces))
    }, s => ApiResponseFt.Right(
      Json.obj(
        ("stub", s.asJson),
        ("collaborators", Json.Null)
      )
    ))
  }
//
//  def extractDataResponse[A: Reads](jsValue: JsValue): ApiResponseFt[A] = {
//    val data = jsValue \ "data"
//    extractResponse[A](data)
//  }
//
//  def extractDataResponseOpt[A: Reads](jsValue: JsValue): ApiResponseFt[Option[A]] = {
//    val data = (jsValue \ "data").toOption
//    ApiResponseFt.Right(data.flatMap(_.asOpt[A]))
//  }
//
//  def extractResponse[A: Reads](jsValue: JsLookupResult): ApiResponseFt[A] = {
//    jsValue.validate[A] match {
//      case JsSuccess(a, _) => ApiResponseFt.Right(a)
//      case error@JsError(_) =>
//        val errMsg = errorMsgs(error)
//        Logger.error(s"JsonParseError failed to parse the json. Error(s): $errMsg 400 badrequest. Json: $jsValue")
//        ApiResponseFt.Left(ApiError("JsonParseError", s"failed to parse the json. Error(s): $errMsg", 400, "badrequest"))
//    }
//  }
//
//  def errorMsgs(error: JsError): String =
//    (for ((path, msgs) <- error.errors; msg <- msgs)
//    yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")


  private def parseResponse[A](json: Json, result: Decoder.Result[A]): ApiResponseFt[A] = result match {
    case Right(a) => ApiResponseFt.Right(a)
    case Left(error) => ApiResponseFt.Left(ApiError.jsonParseError(error.message, json.noSpaces))
  }

  def parseBody(body: String): ApiResponseFt[Json] = parser.parse(body) match {
    case Right(json) => ApiResponseFt.Right(json)
    case Left(error) => ApiResponseFt.Left(ApiError.jsonParseError(error.message, body))
  }

  def extractDataResponseOpt[A](json: Json)(implicit decoder: Decoder[A]): ApiResponseFt[Option[A]] =
    parseResponse[Option[A]](json, json.hcursor.downField("data").as[Option[A]])

  def extractDataResponse[A](json: Json)(implicit decoder: Decoder[A]): ApiResponseFt[A] =
    parseResponse[A](json, json.hcursor.downField("data").as[A])

  def extractResponse[A](json: Json)(implicit decoder: Decoder[A]): ApiResponseFt[A] =
    parseResponse[A](json, json.as[A])
}
