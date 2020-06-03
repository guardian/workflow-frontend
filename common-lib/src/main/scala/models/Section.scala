package models

import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveConfiguredDecoder, deriveConfiguredEncoder}
import io.circe.{Decoder, Encoder}

case class Section(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString: String = name
}

object Section {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[Section] = deriveConfiguredEncoder
  implicit val decoder: Decoder[Section] = deriveConfiguredDecoder

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
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[SerialisedSection] = deriveConfiguredEncoder
  implicit val decoder: Decoder[SerialisedSection] = deriveConfiguredDecoder
}
