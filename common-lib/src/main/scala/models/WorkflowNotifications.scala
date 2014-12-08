package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

sealed trait WorkflowNotification

case class Tag(id: Long, isLead: Boolean, section: Section)
case class Element(elementType: String)
case class Block(id: String, lastModified: DateTime, elements: List[Element])

case class ContentUpdateEvent (
  composerId: String,
  path: Option[String],
  headline: Option[String],
  mainBlock: Option[Block],
  `type`: String,
  whatChanged: String,
  published: Boolean,
  user: Option[String],
  lastModified: DateTime,
  tagSections: Option[List[Tag]],
  status: Status,
  commentable: Boolean,
  lastMajorRevisionDate: Option[DateTime],
  publicationDate: Option[DateTime],
  revision: Option[Long],
  storyBundleId: Option[String]
) extends WorkflowNotification

object ContentUpdateEvent {
  import Status._

  implicit val tagReads: Reads[Tag] = (
    (__ \ "tag" \ "id").read[Long] ~
    (__ \ "isLead").read[Boolean] ~
    (__ \ "tag" \ "section").read[Section]
  )(Tag.apply _)

  implicit val elementReads: Reads[Element] = Json.reads[Element]

  implicit val blockReads: Reads[Block] = (
    (__ \ "id").read[String] ~
    (__ \ "lastModified").read[Long].map(t => new DateTime(t)) ~
    (__ \ "elements").read[List[Element]]
  )(Block.apply _)

  implicit val contentUpdateEventReads: Reads[ContentUpdateEvent] = (
    (__ \ "content" \ "id").read[String] ~
    (__ \ "content" \ "identifiers" \ "path").readNullable[String] ~
    (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
    (__ \ "content" \ "mainBlock").readNullable[Block] ~
    (__ \ "content" \ "type").read[String] ~
    (__ \ "whatChanged").read[String] ~
    (__ \ "content" \ "published").read[Boolean] ~
    readUser ~
    (__ \ "content" \ "contentChangeDetails" \ "lastModified" \ "date").read[Long].map(t => new DateTime(t)) ~
    (__ \ "content" \ "taxonomy").readNullable(
      (__ \ "tags").read[List[Tag]]
    ) ~
    (__ \ "content" \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
    (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
      s => s.exists(_=="true")
    } ~
    (__ \ "content" \ "contentChangeDetails" \ "lastMajorRevisionPublished").readNullable(
      (__ \ "date").read[Long].map(t => new DateTime(t))
    ) ~
    (__ \ "content" \ "contentChangeDetails" \ "published").readNullable(
      (__ \ "date").read[Long].map(t => new DateTime(t))
    ) ~
    (__ \ "content" \ "contentChangeDetails" \ "revision").readNullable[Long] ~
    (__ \ "content" \ "identifiers" \ "storyBundleId").readNullable[String]
    )(ContentUpdateEvent.apply _)

  def readUser = new Reads[Option[String]] {
    def reads(json: JsValue): JsResult[Option[String]] =
      for {
        firstOpt <- (json \ "contentChangeDetails" \ "lastModified" \ "user" \ "firstName").validate[Option[String]]
        lastOpt  <- (json \ "contentChangeDetails" \ "lastModified" \ "user" \ "lastName").validate[Option[String]]
      }
      yield firstOpt.flatMap(f => lastOpt.map(l => f + " " + l))
  }
}

case class LifecycleEvent(
  composerId: String,
  managedByComposer: Boolean,
  event: String,
  eventTime: DateTime
) extends WorkflowNotification

object LifecycleEvent {
  implicit val lifecycleEventReads: Reads[LifecycleEvent] = (
    (__ \ "composerId").read[String] ~
    (__ \ "managedByComposer").read[Boolean] ~
    (__ \ "event").read[String] ~
    (__ \ "eventTime").read[Long].map(t => new DateTime(t))
  )(LifecycleEvent.apply _)
}
