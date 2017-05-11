package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import models.api.ApiResponseFt
import models.{Desk, SerialisedDesk}
import play.api.libs.json._

import scala.concurrent.ExecutionContext.Implicits.global

object DesksAPI {

  def getDesks: ApiResponseFt[List[Desk]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"desks/list"))
      serialisedDesks <- extractDataResponse[List[SerialisedDesk]](res.json)
      desks = serialisedDesks.map(Desk.fromSerialised)
    } yield desks

  def upsertDesk(desk: Desk): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("desks/upsert", Json.toJson(desk)))
      upsertRes <- extractDataResponse[Int](res.json)
    } yield upsertRes

  def removeDesk(desk: Desk): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("desks/remove", Json.toJson(desk)))
      removeRes <- extractDataResponse[Int](res.json)
    } yield removeRes
}
