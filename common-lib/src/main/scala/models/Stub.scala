package models

import models.Flag.Flag
import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat
import play.api.data.validation.ValidationError
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
                prodOffice: String)

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

  object DateFormat extends Format[DateTime] {
    def writes(d: DateTime): JsValue = JsString(d.toString)
    def reads(json: JsValue): JsResult[DateTime] = {
      json.validate[String].flatMap { dt =>
        try { JsSuccess(ISODateTimeFormat.dateTimeParser().parseDateTime(dt)) }
        catch { case e: IllegalArgumentException =>
          JsError(ValidationError("validate.error.expected.date.isoformat",dt))
        }
      }
    }
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
