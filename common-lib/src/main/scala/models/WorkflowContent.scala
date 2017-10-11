package models

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

case class Collaborator(email: String, stubId: Long)
object Collaborator {
  implicit val encoder: Encoder[Collaborator] = deriveEncoder
  implicit val decoder: Decoder[Collaborator] = deriveDecoder
}

case class ContentItemIds(stubId: Long, composerId: Option[String])
object ContentItemIds {
  implicit val encoder: Encoder[ContentItemIds] = deriveEncoder
  implicit val decoder: Decoder[ContentItemIds] = deriveDecoder
}

case class Tag(id: Long, section: Section, `type`: String, externalName: String, path: Option[String] = None)
object Tag {
  implicit val encoder: Encoder[Tag] = deriveEncoder
  implicit val decoder: Decoder[Tag] = deriveDecoder
}

case class TagUsage(tag: Tag, isLead: Boolean)
object TagUsage {
  implicit val encoder: Encoder[TagUsage] = deriveEncoder
  implicit val decoder: Decoder[TagUsage] = deriveDecoder
}

case class TagArrayItem(data: Tag)
object TagArrayItem {
  implicit val encoder: Encoder[TagArrayItem] = deriveEncoder
  implicit val decoder: Decoder[TagArrayItem] = deriveDecoder
}

case class User(email: String, firstName: String, lastName: String)
object User {
  implicit val encoder: Encoder[User] = deriveEncoder
  implicit val decoder: Decoder[User] = deriveDecoder
}
