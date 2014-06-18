package models

import play.api.libs.json.{Json, Writes, JsValue, Reads}


case class Section(name: String) {
  override def toString = name
}

object Section {
  implicit val sectionReads: Reads[Section] = new Reads[Section] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "section" \ "name").validate[String].map(Section(_))
  }

  implicit val section: Writes[Section] = Json.writes[Section]
}
