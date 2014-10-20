package models

import com.gu.workflow.db.Schema
import models.Flag.Flag
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.json.Reads._

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

  implicit val dateTimeFormat = DateFormat
  import play.api.libs.functional.syntax._
  import play.api.libs.json.util._

  implicit val prodOfficeReads = maxLength[String](20)
  implicit val noteReads =  maxLength[String](500)
  implicit val sectionReads = maxLength[String](50)
  implicit val workingTitleReads = maxLength[String](128)

  implicit val jsonReads: Reads[Stub] =( (__ \ "id").readNullable[Long] and
                            (__ \ "title").read[String] and
                            (__ \ "section").read[String] and
                            (__ \ "due").readNullable[DateTime] and
                            (__ \ "assignee").readNullable[String] and
                            (__ \ "composerId").readNullable[String] and
                            (__ \ "contentType").readNullable[String] and
                            (__ \ "priority").read[Int] and
                            (__ \ "needsLegal").read[Flag] and
                            (__ \"note").readNullable[String](noteReads) and
                            (__ \"prodOffice").read[String](prodOfficeReads) and
                            (__ \ "createdAt").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) }
                        )(Stub.apply _)


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
