package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import models._
import models.api._
import play.api.libs.json._

import scala.concurrent.ExecutionContext.Implicits.global

object CommonAPI {

  def deleteStubs(composerIds: Seq[String]): ApiResponseFt[Seq[String]] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/delete", Json.toJson(composerIds)))
      deleteRes <- extractDataResponse[Seq[String]](res.json)
    } yield deleteRes

  def takeDownStubs(takedownRequest: TakedownRequest): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/takedown", Json.toJson(takedownRequest)))
      takeDownRes <- extractDataResponse[Int](res.json)
    } yield takeDownRes

  def trashStubs(stubIds: Seq[Long]): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/trash", Json.toJson(stubIds)))
      stubIdCount <- extractDataResponse[Int](res.json)
    } yield stubIdCount

  def getPublishedNotHold24Hours: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldPublished"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield listRes

  def getStubsToDelete: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldTrashed"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield listRes

  def getStubsToTrash: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("old30Days"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield listRes

  def getStubsByComposerId(composerId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content/$composerId"))
      itemRes <- extractDataResponseOpt[Stub](res.json)
    } yield itemRes

  def getStubs(queryString: Map[String, Seq[String]]): ApiResponseFt[ContentResponse] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs", Some(queryString
        .toList.flatMap(x => x._2 map ( y => x._1 -> y)))))
      contentRes <- extractDataResponse[ContentResponse](res.json)
    } yield contentRes
}
