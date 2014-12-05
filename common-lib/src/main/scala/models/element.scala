package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._


case class Element(elementType: String)
object Element{ 
  implicit val elementReads: Reads[Element] = Json.reads[Element]
}
