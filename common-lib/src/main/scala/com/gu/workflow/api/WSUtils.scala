package com.gu.workflow.api

import io.circe.Json
import play.api.libs.ws.{WSClient, WSRequest, WSResponse}

import scala.concurrent.Future
import scala.concurrent.duration._

trait WSUtils {
  def apiRoot: String
  def ws: WSClient

  protected def buildRequest(path: String): WSRequest = ws.url(s"$apiRoot/$path")

  def deleteRequest(path: String): Future[WSResponse] = buildRequest(path).delete()

  def postRequest(path: String, data: Json = Json.Null): Future[WSResponse] =
    buildRequest(path).withHttpHeaders("Content-Type" -> "application/json").post(data.toString())

  def putRequest(path: String, data: Json = Json.Null): Future[WSResponse] =
    buildRequest(path).withHttpHeaders("Content-Type" -> "application/json").put(data.toString())

  def getRequest(path: String, params: List[(String, String)] = List.empty, headers: List[(String, String)] = List.empty): Future[WSResponse] = {
    val baseRequest = buildRequest(path)
    val requestWithQueryString = if(params.nonEmpty) baseRequest.withQueryStringParameters(params: _*) else baseRequest
    val finalRequest = if(headers.nonEmpty) requestWithQueryString.withHttpHeaders(headers: _*) else requestWithQueryString
    
    finalRequest.get()
  }
}
