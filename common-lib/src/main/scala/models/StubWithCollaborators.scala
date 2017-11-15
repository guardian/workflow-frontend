package models

import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

case class StubWithCollaborators(stub: Stub, collaborators: List[User] = Nil)

object StubWithCollaborators {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[StubWithCollaborators] = deriveEncoder
  implicit val decoder: Decoder[StubWithCollaborators] = deriveDecoder
}