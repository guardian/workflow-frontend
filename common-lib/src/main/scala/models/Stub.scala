package models

import models.Flag.Flag
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.json.Reads._

case class Stub(id: Option[Long] = None,
                title: String,
                section: String,
                due: Option[DateTime] = None,
                assignee: Option[String] = None,
                assigneeEmail: Option[String] = None,
                composerId: Option[String] = None,
                contentType: String,
                priority: Int,
                needsLegal: Flag,
                note: Option[String] = None,
                prodOffice: String,
                createdAt: DateTime = DateTime.now(),
                lastModified: DateTime = DateTime.now(),
                trashed: Boolean = false,
                commissioningDesks: Option[String] = None)

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
                            (__ \ "section" \ "name").read[String].orElse((__ \ "section").read[String]) and
                            (__ \ "due").readNullable[DateTime] and
                            (__ \ "assignee").readNullable[String] and
                            (__ \ "assigneeEmail").readNullable[String] and
                            (__ \ "composerId").readNullable[String] and
                            (__ \ "contentType").read[String] and
                            (__ \ "priority").readNullable[Int].map(_.getOrElse(0)) and
                            (__ \ "needsLegal").readNullable[Flag].map(f  => f.getOrElse(Flag.NotRequired)) and
                            (__ \"note").readNullable[String](noteReads) and
                            (__ \"prodOffice").read[String](prodOfficeReads) and
                            (__ \ "createdAt").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) } and
                            (__ \ "lastModified").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) } and
                            (__ \ "trashed").readNullable[Boolean].map(t=> t.getOrElse(false)) and
                            (__ \ "commissioningDesks").readNullable[String]
                        )(Stub.apply _)


  implicit val stubWrites: Writes[Stub] = Json.writes[Stub]
}

object Flag extends Enumeration {
  type Flag = Value

  val NotRequired = Value("NA")
  val Required    = Value("REQUIRED")
  val Complete    = Value("COMPLETE")

  implicit val enumReads: Reads[Flag] = EnumUtils.enumReads(Flag)

  implicit def enumWrites: Writes[Flag] = EnumUtils.enumWrites
}
