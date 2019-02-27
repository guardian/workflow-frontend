package com.gu.workflow.lib

import io.circe.{Decoder, Encoder}
import io.circe.generic.{semiauto => basicDerivation}

case class Priority(name: String, value: Int)
object Priority {
  implicit val encoder: Encoder[Priority] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[Priority] = basicDerivation.deriveDecoder
}

object Priorities {
  val all = List(
    Priority("Very-Low", -2),
    Priority("Low", -1),
    Priority("Normal", 0),
    Priority("Urgent", 1),
    Priority("Very-Urgent", 2)
  )
}
