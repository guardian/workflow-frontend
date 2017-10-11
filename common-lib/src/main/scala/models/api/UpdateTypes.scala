package models.api

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

case class ContentUpdate(stubId: Long, stubRowsUpdated: Option[Long] = None, collaboratorRowsUpdated: Option[Long] = None)
object ContentUpdate {
  implicit val encoder: Encoder[ContentUpdate] = deriveEncoder
  implicit val decoder: Decoder[ContentUpdate] = deriveDecoder
}
case class DeleteOp(stubId: Long)
object DeleteOp {
  implicit val encoder: Encoder[DeleteOp] = deriveEncoder
  implicit val decoder: Decoder[DeleteOp] = deriveDecoder
}

sealed trait ContentUpdateError

case class DatabaseError(message: String) extends ContentUpdateError
case object ContentItemExists extends ContentUpdateError
case class StubNotFound(id: Long) extends ContentUpdateError
case class UpdateRevisionTooLow(stubId: Long, updateRevision: Option[Long]) extends ContentUpdateError
case class ComposerIdsConflict(stubComposerId: Option[String], wcComposerId: Option[String]) extends ContentUpdateError
