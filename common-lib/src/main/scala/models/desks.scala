package models

import play.api.libs.json._


case class Desk(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString = name
}

object Desk {
  implicit val deskReads: Reads[Desk] = new Reads[Desk] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "desk" \ "name").validate[String].map(Desk(_))
  }

  implicit val desk = Json.format[Desk]
}
