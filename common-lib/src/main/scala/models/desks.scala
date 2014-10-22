package models

import play.api.libs.json._


case class Desk(name: String) {
  override def toString = name
}

object Desk {
  implicit val deskReads: Reads[Desk] = new Reads[Desk] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "desk" \ "name").validate[String].map(Desk(_))
  }

  implicit val desk: Writes[Desk] = new Writes[Desk] {
    def writes(desk: Desk): JsValue = JsString(desk.name)
  }
}
