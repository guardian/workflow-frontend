package com.gu.workflow.lib

import models.Stub
import models.api._
import play.api.libs.json.{Format, Json}

import scala.concurrent.ExecutionContext.Implicits.global

case class ContentUpdateChanges(collaboratorsInserted: List[String], stubRowsUpdated: Int)
object ContentUpdateChanges { implicit val jsonFormats: Format[ContentUpdateChanges] = Json.format[ContentUpdateChanges]}

object DBToAPIResponse {
  def upsertContentResponse(cuEit: Either[ContentUpdateError, ContentUpdate]): ApiResponseFt[ContentUpdate] = {
    cuEit match {
      case Left(db: DatabaseError) => ApiResponseFt.Left(ApiErrors.databaseError(db.message))
      case Left(ContentItemExists) => ApiResponseFt.Left(ApiErrors.conflict)
      case Left(s: StubNotFound) => ApiResponseFt.Left(ApiErrors.updateError(s.id))
      case Left(s: UpdateRevisionTooLow) => ApiResponseFt.Left(ApiErrors.updateErrorRevisionTooLow(s))
      case Left(c: ComposerIdsConflict) => ApiResponseFt.Left(ApiErrors.conflict)
      case Right(cu) => ApiResponseFt.Right(cu)
    }
  }

  def updateRes[A](id: A, updatedRow: Int): ApiResponseFt[A] = {
    if(updatedRow==0) ApiResponseFt.Left(ApiErrors.updateError(id))
    else ApiResponseFt.Right(id)
  }

  def getResponse(res: ApiResponseFt[Option[Stub]]): ApiResponseFt[Option[Stub]] = res.flatMap {
    case Some(item) => ApiResponseFt.Right[Option[Stub]](Some(item))
    case None => ApiResponseFt.Left[Option[Stub]](ApiErrors.notFound)
  }

}
