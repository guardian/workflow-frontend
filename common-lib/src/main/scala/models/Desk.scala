package models

import io.circe.generic.extras.Configuration
import io.circe.{Decoder, Encoder}
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}

case class Desk(name: String, selected: Boolean = false, id: Long = 0) {
  override def toString: String = name
}

object Desk {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[Desk] = deriveEncoder
  implicit val decoder: Decoder[Desk] = deriveDecoder

  def fromSerialised(sd: SerialisedDesk): Desk = {
    Desk(
      name = sd.name,
      selected = sd.selected,
      id = sd.id
    )
  }
}

case class SerialisedDesk(name: String, selected: Boolean = false, id: Long = 0)
object SerialisedDesk {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[SerialisedDesk] = deriveEncoder
  implicit val decoder: Decoder[SerialisedDesk] = deriveDecoder
}
