package com.gu.workflow.api

import models.api.ApiResponseFt
import models.{Desk, SerialisedDesk}
import io.circe.syntax._
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global

class DesksAPI(
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils {

  def getDesks: ApiResponseFt[List[Desk]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"desks/list"))
      json <- parseBody(res.body)
      serialisedDesks <- extractDataResponse[List[SerialisedDesk]](json)
      desks = serialisedDesks.map(Desk.fromSerialised)
    } yield desks

  def upsertDesk(desk: Desk): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("desks/upsert", desk.asJson))
      json <- parseBody(res.body)
      upsertRes <- extractDataResponse[Int](json)
    } yield upsertRes

  def removeDesk(desk: Desk): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("desks/remove", desk.asJson))
      json <- parseBody(res.body)
      removeRes <- extractDataResponse[Int](json)
    } yield removeRes
}
