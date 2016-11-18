package com.gu.workflow.api

import com.gu.workflow.lib.ContentUpdateChanges
import models.api.ContentResponse
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import scala.util.Either
import models.api._
import models.{WorkflowContent, ContentUpdateEvent, ContentItem, ContentItemIds}
import com.gu.workflow.api.ApiUtils._
import play.api.Logger

object CommonAPI {

  def deleteContent(composerIds: Seq[String]): ApiResponseFt[DeleteResult] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("deleteContent", Json.toJson(composerIds)))
      deleteRes <- extractDataResponse[DeleteResult](res.json)
    } yield {
      deleteRes
    }
  }

  def takeDownContent(takedownRequest: TakedownRequest): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("takeDownContent", Json.toJson(takedownRequest)))
      takeDownRes <- extractDataResponse[Int](res.json)
    } yield {
      takeDownRes
    }
  }

  def updateContentFromUpdateEvent(updateContentRequest: UpdateContentRequest): ApiResponseFt[ContentUpdateChanges] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("updateContentFromUpdateEvent", Json.toJson(updateContentRequest)))
      updateRes <- extractDataResponse[ContentUpdateChanges](res.json)
    } yield {
      updateRes
    }
  }

  def trashStubs(stubIds: Seq[Long]): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("trashStubs", Json.toJson(stubIds)))
      stubIdCount <- extractDataResponse[Int](res.json)
    } yield {
      stubIdCount
    }
  }

  def getPublishedNotHold24Hours(): ApiResponseFt[List[ContentItemIds]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldPublished"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield {
      listRes
    }
  }

  def getContentToDelete(): ApiResponseFt[List[ContentItemIds]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldTrashed"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield {
      listRes
    }
  }

  def getContentToTrash(): ApiResponseFt[List[ContentItemIds]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest("old30Days"))
      listRes <- extractDataResponse[List[ContentItemIds]](res.json)
    } yield {
      listRes
    }
  }

  def getContentByComposerId(id: String): ApiResponseFt[Option[ContentItem]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"getContentByComposerId/$id"))
      itemRes <- extractDataResponseOpt[ContentItem](res.json)
    } yield {
      itemRes
    }
  }

  def getContent(queryString: Map[String, Seq[String]]): ApiResponseFt[ContentResponse] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content", Some(queryString
        .toList.flatMap(x => x._2 map ( y => (x._1 -> y))))))
      contentRes <- extractDataResponse[ContentResponse](res.json)
    } yield {
      contentRes
    }
  }
}
