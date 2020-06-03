package models

import io.circe.generic.extras.{Configuration, semiauto => derivationWithDefaults}
import io.circe.generic.{semiauto => basicDerivation}
import io.circe.{Decoder, Encoder}

case class ContentItemIds(stubId: Long, composerId: Option[String])
object ContentItemIds {
  implicit val encoder: Encoder[ContentItemIds] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[ContentItemIds] = basicDerivation.deriveDecoder
}

case class Tag(id: Long, section: Section, `type`: String, externalName: String, path: Option[String] = None)
object Tag {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[Tag] = derivationWithDefaults.deriveConfiguredEncoder
  implicit val decoder: Decoder[Tag] = derivationWithDefaults.deriveConfiguredDecoder
}

case class User(email: String, firstName: String, lastName: String)
object User {
  implicit val encoder: Encoder[User] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[User] = basicDerivation.deriveDecoder
}
