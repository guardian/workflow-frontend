package lib

import lib.Response._
import play.api.libs.json.Json

case class ContentUpdate(stubId: Long, composerId: Option[String])
case class DeleteOp(stubId: Long, composerRows: Int)

object DeleteOp {
  implicit val jsonFormats = Json.format[DeleteOp]

}

sealed trait ContentUpdateError

case class DatabaseError(message: String) extends ContentUpdateError
case object ContentItemExists extends ContentUpdateError
case class StubNotFound(id: Long) extends ContentUpdateError
  case class ComposerIdsConflict(stubComposerId: Option[String], wcComposerId: Option[String]) extends ContentUpdateError

object ContentUpdate {
  implicit val jsonFormats = Json.format[ContentUpdate]

}

object DBToAPIResponse {

  def updateStubRes(id: Long, updatedRow: Int): Response[Long] = {
    if(updatedRow==0) Left(ApiErrors.updateError(id))
    else Right(ApiSuccess(id))
  }

  def updateWorkflowRes(id: String, updatedRow: Int): Response[String] = {
    if(updatedRow==0) Left(ApiErrors.composerIdNotFound(id))
    else Right(ApiSuccess(id))
  }

  def upsertContentResponse(cuEit: Either[ContentUpdateError, ContentUpdate]): Response[ContentUpdate] = {
    cuEit match {
      case Left(db: DatabaseError) => Left(ApiErrors.databaseError(db.message))
      case Left(ContentItemExists) => Left(ApiErrors.conflict)
      case Left(s: StubNotFound) => Left(ApiErrors.updateError(s.id))
      case Left(c: ComposerIdsConflict) => Left(ApiErrors.conflict)
      case Right(cu) => Right(ApiSuccess(cu))
    }
  }

  def deleteResponse(id: Long, dOpt: Option[DeleteOp]): Response[DeleteOp] = {
    dOpt match {
      case Some(d) => Right(ApiSuccess(d))
      case None => Left(ApiErrors.updateError(id))
    }

  }

}
