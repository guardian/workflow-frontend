package models

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

case class StubWithCollaborators(stub: Stub, collaborators: List[User] = Nil)

object StubWithCollaborators {
  implicit val encoder: Encoder[StubWithCollaborators] = deriveEncoder
  implicit val decoder: Decoder[StubWithCollaborators] = deriveDecoder
}