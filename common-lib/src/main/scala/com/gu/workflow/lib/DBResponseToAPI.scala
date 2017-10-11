package com.gu.workflow.lib

import models.Stub
import models.api._
import play.api.Logger

import scala.concurrent.ExecutionContext.Implicits.global

case class ContentUpdateChanges(collaboratorsInserted: List[String], stubRowsUpdated: Int)

object DBToAPIResponse {
  def upsertContentResponse(cuEit: Either[ContentUpdateError, ContentUpdate]): ApiResponseFt[ContentUpdate] = {
    cuEit match {
      case Left(db: DatabaseError) =>
        Logger.error(s"ContentUpdateError - DatabaseError - ${db.message}")
        ApiResponseFt.Left(ApiError.databaseError(db.message))
      case Left(ContentItemExists) =>
        Logger.error("ContentUpdateError - ContentItemExists")
        ApiResponseFt.Left(ApiError.conflict)
      case Left(s: StubNotFound) =>
        Logger.error(s"ContentUpdateError - StubNotFound - ${s.id}")
        ApiResponseFt.Left(ApiError.updateError(s.id))
      case Left(s: UpdateRevisionTooLow) =>
        Logger.error(s"ContentUpdateError - UpdateRevisionTooLow stubid: ${s.stubId} updateRevision: ${s.updateRevision}")
        ApiResponseFt.Left(ApiError.updateErrorRevisionTooLow(s))
      case Left(c: ComposerIdsConflict) =>
        Logger.error("ContentUpdateError - ComposerIdsConflict")
        ApiResponseFt.Left(ApiError.conflict)
      case Right(cu) => ApiResponseFt.Right(cu)
    }
  }

  def getResponse(res: ApiResponseFt[Option[Stub]]): ApiResponseFt[Option[Stub]] = res.flatMap {
    case Some(item) => ApiResponseFt.Right[Option[Stub]](Some(item))
    case None => ApiResponseFt.Left[Option[Stub]](ApiError.notFound)
  }

}
