package models

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

case class Section(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString: String = name
}

object Section {
  implicit val encoder: Encoder[Section] = deriveEncoder
  implicit val decoder: Decoder[Section] = deriveDecoder

  def fromSerialised(ss: SerialisedSection): Section  = {
    Section(
      name = ss.name,
      selected = ss.selected,
      id = ss.id
    )
  }
}

case class SerialisedSection(name: String, selected: Boolean = false, id: Long = 0)
object SerialisedSection {
  implicit val encoder: Encoder[SerialisedSection] = deriveEncoder
  implicit val decoder: Decoder[SerialisedSection] = deriveDecoder
}
