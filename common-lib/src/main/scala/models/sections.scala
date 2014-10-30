package models

import play.api.libs.json._


case class Section(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString = name
}

object Section {
  implicit val sectionReads: Reads[Section] = new Reads[Section] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "section" \ "name").validate[String].map(Section(_))
  }

  implicit val section = Json.format[Section]
}
