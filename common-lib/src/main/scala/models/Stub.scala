package models

import models.Flag.Flag
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.json.Reads._
import play.api.libs.functional.syntax._
import play.api.libs.json.util._

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
               commissioningDesks: Option[String] = None,
               externalData: Option[ExternalData])

case class ExternalData(path: Option[String] = None,
  lastModified: Option[DateTime] = None,
  status: Option[Status] = None,
  published: Option[Boolean] = None,
  timePublished: Option[DateTime] = None,
  revision: Option[Long] = None,
  storyBundleId: Option[String] = None,
  activeInInCopy: Option[Boolean] = None,
  takenDown: Option[Boolean] = None,
  timeTakenDown: Option[DateTime] = None,
  wordCount: Option[Int] = None,
  embargoedUntil: Option[DateTime] = None,
  embargoedIndefinitely: Option[Boolean] = None,
  scheduledLaunchDate: Option[DateTime] = None,
  optimisedForWeb: Option[Boolean] = None,
  optimisedForWebChanged: Option[Boolean] = None,
  sensitive: Option[Boolean] = None,
  legallySensitive: Option[Boolean] = None,
  headline: Option[String] = None,
  hasMainMedia: Option[Boolean] = None,
  commentable: Option[Boolean] = None)

object ExternalData {

  implicit val dateTimeFormat = DateFormat

  implicit val externalDataJsonReads: Reads[ExternalData] = (
    (__ \ "path").readNullable[String] and
      (__ \ "lastModified").readNullable[DateTime] and
      (__ \ "status").readNullable[String].map(s => s.map(Status(_))) and
      (__ \ "published").readNullable[Boolean] and
      (__ \ "timePublished").readNullable[DateTime] and
      (__ \ "revision").readNullable[Long] and
      (__ \ "storyBundleId").readNullable[String] and
      (__ \ "activeInInCopy").readNullable[Boolean] and
      (__ \ "takenDown").readNullable[Boolean] and
      (__ \ "timeTakenDown").readNullable[DateTime] and
      (__ \ "wordCount").readNullable[Int] and
      (__ \ "embargoedUntil").readNullable[DateTime] and
      (__ \ "embargoedIndefinitely").readNullable[Boolean] and
      (__ \ "scheduledLaunchDate").readNullable[DateTime] and
      (__ \ "optimisedForWeb").readNullable[Boolean] and
      (__ \ "optimisedForWebChanged").readNullable[Boolean] and
      (__ \ "sensitive").readNullable[Boolean] and
      (__ \ "legallySensitive").readNullable[Boolean] and
      (__ \ "headline").readNullable[String] and
      (__ \ "hasMainMedia").readNullable[Boolean] and
      (__ \ "commentable").readNullable[Boolean]
    )(ExternalData.apply _)

  implicit val jsonWrites: Writes[ExternalData] = Json.writes[ExternalData]
}

object Stub {

  import ExternalData._

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
                            (__ \ "note").readNullable[String](noteReads) and
                            (__ \ "prodOffice").read[String](prodOfficeReads) and
                            (__ \ "createdAt").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) } and
                            (__ \ "lastModified").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) } and
                            (__ \ "trashed").readNullable[Boolean].map(t=> t.getOrElse(false)) and
                            (__ \ "commissioningDesks").readNullable[String] and
                            (__ \ "externalData").readNullable[ExternalData](externalDataJsonReads)
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
