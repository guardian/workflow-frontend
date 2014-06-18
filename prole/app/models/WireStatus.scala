package models

import org.joda.time.DateTime
import models.{Status, Section}


case class WireStatus(
                       composerId: String,
                       path: Option[String],
                       headline: Option[String],
                       `type`: String,
                       published: Boolean,
                       user: Option[String],
                       lastModified: DateTime,
                       tagSections: List[Section],
                       status: Status,
                       commentable: Boolean)

import play.api.libs.json._
import play.api.libs.functional.syntax._

object WireStatus {

  val readTagSections = new Reads[List[Section]] {
    def reads(json: JsValue): JsResult[List[Section]] = {
      (json \ "content" \ "taxonomy" \ "tags").validate[Option[List[Section]]].map(_.toList.flatten)
    }

  }

  def readUser = new Reads[Option[String]] {
    def reads(json: JsValue): JsResult[Option[String]] =
      for {
        firstOpt <- (json \ "content" \ "lastModifiedBy" \ "firstName").validate[Option[String]]
        lastOpt  <- (json \ "content" \ "lastModifiedBy" \ "lastName").validate[Option[String]]
      }
      yield firstOpt.flatMap(f => lastOpt.map(l => f + " " + l))
  }

  import Status._
  implicit val wireStatusReads: Reads[WireStatus] =
    ((__ \ "content" \ "identifiers" \ "composerId").read[String] ~
      (__ \ "content" \ "identifiers" \ "path").readNullable[String] ~
      (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
      (__ \ "content" \ "type").read[String] ~
      (__ \ "published").read[Boolean] ~
      readUser ~
      (__ \ "content" \ "lastModified").read[Long].map(t => new DateTime(t)) ~
      readTagSections ~
      (__ \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
      (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
        s => s.exists(_=="true")
      }
      )(WireStatus.apply _)

}