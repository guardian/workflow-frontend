package models

import com.gu.workflow.db.Schema
import models.Flag.Flag
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

case class Stub(id: Option[Long],
                title: String,
                section: String,
                due: Option[DateTime],
                assignee: Option[String],
                composerId: Option[String],
                contentType: Option[String],
                priority: Int,
                needsLegal: Flag,
                note: Option[String],
                prodOffice: String,
                createdAt: DateTime = DateTime.now())

object Stub {
  // validation requirements for individual fields
  val prodOfficeReads = Reads.maxLength[String](20)
  val noteReads       = Reads.maxLength[String](500)

  implicit val dateTimeFormat = DateFormat
  implicit val stubReads: Reads[Stub] =
    (__ \ "prodOffice").read(prodOfficeReads) andKeep
      (__ \ "note").readNullable(noteReads) andKeep
      Json.reads[Stub]

  implicit val stubWrites: Writes[Stub] = Json.writes[Stub]

  def fromStubRow(row: Schema.StubRow): Stub = row match {
    case (pk, title, section, due, assignee, composerId, contentType, priority,
          needsLegal, note, prodOffice, createdAt) =>
      Stub(Some(pk), title, section, due, assignee, composerId, contentType, priority,
           needsLegal, note, prodOffice, createdAt)
  }

  /* provide a tuple suitable for insertion into the database */
  def newStubRow(s: Stub) = s match {
    case Stub(_, title, section, due, assignee, composerId, contentType, priority,
              needsLegal, note, prodOffice, createdAt) =>
      (0L, title, section, due, assignee, composerId, contentType, priority,
       needsLegal, note, prodOffice, createdAt)
  }
}

object Flag extends Enumeration {
  type Flag = Value

  val NotRequired = Value("NA")
  val Required    = Value("REQUIRED")
  val Complete    = Value("COMPLETE")

  implicit val enumReads: Reads[Flag] = EnumUtils.enumReads(Flag)

  implicit def enumWrites: Writes[Flag] = EnumUtils.enumWrites
}
