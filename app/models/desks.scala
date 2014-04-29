package models

import play.api.libs.json.{Json, Writes, JsValue, Reads}


case class Desk(name: String) {
  override def toString = name
}

object Desk {
  implicit val deskReads: Reads[Desk] = new Reads[Desk] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "section" \ "name").validate[String].map(Desk(_))
  }

  implicit val desk: Writes[Desk] = Json.writes[Desk]
}
