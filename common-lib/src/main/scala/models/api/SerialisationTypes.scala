package models.api

import models._
import play.api.libs.json._
import org.joda.time.DateTime


// types used for serialising requests and responses to and from the datastore API

case class DeskAndSection(sectionId: Long, deskId: Long)
object DeskAndSection { implicit val jsonFormats = Json.format[DeskAndSection] }

case class SectionsInDeskMapping (deskId: Long, sectionIds: List[Long])
object SectionsInDeskMapping {
  implicit val sectionsInDeskJSONFormat = Json.format[SectionsInDeskMapping]
}

case class SectionRelation(desk: Desk, sections: List[Section])
object SectionRelation { implicit val jsonFormats = Json.format[SectionRelation] }

// foo was added to make JSON parsing work
case class DeleteResult(stubCount: Int, foo: Option[String] = None)
object DeleteResult { implicit val jsonFormats = Json.format[DeleteResult] }

case class TakedownRequest(composerId: String, t: Option[DateTime])
object TakedownRequest { implicit val jsonFormats = Json.format[TakedownRequest]}

