package models

import play.api.libs.json._


case class Section(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString = name
}

object Section {
  implicit val sectionReads: Reads[Section] = new Reads[Section] {
    def reads(jsValue: JsValue) = (jsValue \ "name").validate[String].map(Section(_))
  }

  implicit val section = Json.writes[Section]

  def fromSerialised(ss: SerialisedSection): Section  = {
    Section(
      name = ss.name,
      selected = ss.selected,
      id = ss.id
    )
  }
}


case class SerialisedSection(name: String, selected: Boolean = false, id: Long = 0)
object SerialisedSection { implicit val jsonFormats = Json.format[SerialisedSection] }
