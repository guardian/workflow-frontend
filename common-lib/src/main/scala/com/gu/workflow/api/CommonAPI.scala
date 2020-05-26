package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import com.gu.workflow.lib.QueryString
import io.circe.syntax._
import models._
import models.api._

import scala.concurrent.ExecutionContext.Implicits.global

object CommonAPI {

  def deleteStubs(composerIds: Seq[String]): ApiResponseFt[Seq[String]] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/delete", composerIds.asJson))
      json <- parseBody(res.body)
      deleteRes <- extractDataResponse[Seq[String]](json)
    } yield deleteRes

  def takeDownStubs(takedownRequest: TakedownRequest): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/takedown", takedownRequest.asJson))
      json <- parseBody(res.body)
      takeDownRes <- extractDataResponse[Int](json)
    } yield takeDownRes

  def trashStubs(stubIds: Seq[Long]): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/trash", stubIds.asJson))
      json <- parseBody(res.body)
      stubIdCount <- extractDataResponse[Int](json)
    } yield stubIdCount

  def getPublishedNotHold24Hours: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldPublished"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubsToDelete: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldTrashed"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubsToTrash: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("old30Days"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubsByComposerId(composerId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content/$composerId"))
      json <- parseBody(res.body)
      itemRes <- extractDataResponseOpt[Stub](json)
    } yield itemRes

  def getStubsByEditorId(editorId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"atom/$editorId"))
      json <- parseBody(res.body)
      itemRes <- extractDataResponseOpt[Stub](json)
    } yield itemRes

  def getStubs(queryString: Map[String, Seq[String]]): ApiResponseFt[ContentResponse] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs", Some(QueryString.flatten(queryString))))
      json <- parseBody(res.body)
      contentRes <- extractDataResponse[ContentResponse](json)
    } yield contentRes
}
