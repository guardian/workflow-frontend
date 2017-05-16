package models.api
import play.api.libs.json._


case class ContentUpdate(stubId: Long, stubRowsUpdated: Option[Long] = None, collaboratorRowsUpdated: Option[Long] = None)
case class DeleteOp(stubId: Long)
object ContentUpdate { implicit val jsonFormats = Json.format[ContentUpdate] }
object DeleteOp { implicit val jsonFormats = Json.format[DeleteOp] }

sealed trait ContentUpdateError

case class DatabaseError(message: String) extends ContentUpdateError
object DatabaseError { implicit val jsonFormats = Json.format[DatabaseError] }
case object ContentItemExists extends ContentUpdateError
case class StubNotFound(id: Long) extends ContentUpdateError
object StubNotFound { implicit val jsonFormats = Json.format[StubNotFound] }
case class UpdateRevisionTooLow(stubId: Long, updateRevision: Option[Long]) extends ContentUpdateError
object UpdateRevisionTooLow { implicit val jsonFormats = Json.format[StubNotFound] }
case class ComposerIdsConflict(stubComposerId: Option[String], wcComposerId: Option[String]) extends ContentUpdateError
object ComposerIdsConflict { implicit val jsonFormats = Json.format[ComposerIdsConflict]}
