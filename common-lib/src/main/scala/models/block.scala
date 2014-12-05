package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._


case class Block(id: String, lastModified: DateTime, elements: List[Element])
object Block {
  implicit val blockReads: Reads[Block] = (
    (__ \ "id").read[String] ~
    (__ \ "lastModified").read[Long].map(t => new DateTime(t)) ~
    (__ \ "elements").read[List[Element]]
  )(Block.apply _)
}
