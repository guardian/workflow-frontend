package models

import play.api.libs.json.{Format, Json}

case class StubWithCollaborators(stub: Stub, collaborators: List[User] = Nil)

object StubWithCollaborators {
  implicit val jsonFormats: Format[StubWithCollaborators] = Json.format[StubWithCollaborators]
}
