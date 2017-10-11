package models.api

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import models._
import org.joda.time.DateTime

// types used for serialising requests and responses to and from the datastore API

case class DeskAndSection(sectionId: Long, deskId: Long)
object DeskAndSection {
  implicit val encoder: Encoder[DeskAndSection] = deriveEncoder
  implicit val decoder: Decoder[DeskAndSection] = deriveDecoder
}

case class SectionsInDeskMapping (deskId: Long, sectionIds: List[Long])
object SectionsInDeskMapping {
  implicit val encoder: Encoder[SectionsInDeskMapping] = deriveEncoder
  implicit val decoder: Decoder[SectionsInDeskMapping] = deriveDecoder
}

case class SectionRelation(desk: Desk, sections: List[Section])
object SectionRelation {
  implicit val encoder: Encoder[SectionRelation] = deriveEncoder
  implicit val decoder: Decoder[SectionRelation] = deriveDecoder
}

case class DeleteResult(stubCount: Int)
object DeleteResult {
  implicit val encoder: Encoder[DeleteResult] = deriveEncoder
  implicit val decoder: Decoder[DeleteResult] = deriveDecoder
}

case class TakedownRequest(composerId: String, t: Option[DateTime])
object TakedownRequest {
  import DateFormat._
  implicit val encoder: Encoder[TakedownRequest] = deriveEncoder
  implicit val decoder: Decoder[TakedownRequest] = deriveDecoder
}
