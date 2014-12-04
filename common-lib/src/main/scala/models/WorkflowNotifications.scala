package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

sealed trait WorkflowNotification

case class LiveContentUpdateEvent (
  composerId: String,
  path: Option[String],
  headline: Option[String],
  `type`: String,
  whatChanged: String,
  published: Boolean,
  user: Option[String],
  lastModified: DateTime,
  tagSections: List[Section],
  status: Status,
  commentable: Boolean,
  lastMajorRevisionDate: Option[DateTime],
  publicationDate: Option[DateTime],
  revision: Option[Long],
  storyBundleId: Option[String]
) extends WorkflowNotification

case class DraftContentUpdateEvent (
  composerId: String,
  path: Option[String],
  headline: Option[String],
  `type`: String,
  whatChanged: String,
  published: Boolean,
  user: Option[String],
  lastModified: DateTime,
  tagSections: List[Section],
  status: Status,
  commentable: Boolean,
  lastMajorRevisionDate: Option[DateTime],
  publicationDate: Option[DateTime],
  revision: Option[Long],
  storyBundleId: Option[String]
) extends WorkflowNotification

object DraftContentUpdateEvent extends ContentUpdateEvent {
  import Status._
  implicit val draftcontentUpdateEventReads: Reads[DraftContentUpdateEvent] = (
    (__ \ "content" \ "id").read[String] ~
    (__ \ "content" \ "identifiers" \ "path").readNullable[String] ~
    (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
    (__ \ "content" \ "type").read[String] ~
    (__ \ "whatChanged").read[String] ~
    (__ \ "content" \ "published").read[Boolean] ~
    readUser ~
    (__ \ "content" \ "contentChangeDetails" \ "lastModified" \ "date").read[Long].map(t => new DateTime(t)) ~
    readTagSections ~
    (__ \ "content" \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
    (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
      s => s.exists(_=="true")
    } ~
    (__ \ "content" \ "contentChangeDetails" \ "lastMajorRevisionPublished" \ "date").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
    (__ \ "content" \ "contentChangeDetails" \ "published" \ "date").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
    (__ \ "content" \ "contentChangeDetails" \ "revision").readNullable[Long] ~
    (__ \ "content" \ "identifiers" \ "storyBundleId").readNullable[String]
    )(DraftContentUpdateEvent.apply _)
}

object LiveContentUpdateEvent extends ContentUpdateEvent {
  import Status._
  implicit val liveContentUpdateEventReads: Reads[LiveContentUpdateEvent] = (
    (__ \ "content" \ "id").read[String] ~
    (__ \ "content" \ "identifiers" \ "path").readNullable[String] ~
    (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
    (__ \ "content" \ "type").read[String] ~
    (__ \ "whatChanged").read[String] ~
    (__ \ "content" \ "published").read[Boolean] ~
    readUser ~
    (__ \ "content" \ "contentChangeDetails" \ "lastModified" \ "date").read[Long].map(t => new DateTime(t)) ~
    readTagSections ~
    (__ \ "content" \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
    (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
      s => s.exists(_=="true")
    } ~
    (__ \ "content" \ "contentChangeDetails" \ "lastMajorRevisionPublished" \ "date").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
    (__ \ "content" \ "contentChangeDetails" \ "published" \ "date").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
    (__ \ "content" \ "contentChangeDetails" \ "revision").readNullable[Long] ~
    (__ \ "content" \ "identifiers" \ "storyBundleId").readNullable[String]
  )(LiveContentUpdateEvent.apply _)
}

trait ContentUpdateEvent {
  val readTagSections = new Reads[List[Section]] {
    def reads(json: JsValue): JsResult[List[Section]] = {
      (json \ "content" \ "taxonomy" \ "tags").validate[Option[List[Section]]].map(_.toList.flatten)
    }
  }

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

case class WireStatus(
  composerId: String,
  path: Option[String],
  headline: Option[String],
  mainMedia: Option[String],
  `type`: String,
  whatChanged: String,
  published: Boolean,
  user: Option[String],
  lastModified: DateTime,
  tagSections: List[Section],
  status: Status,
  commentable: Boolean,
  lastMajorRevisionDate: Option[DateTime],
  publicationDate: Option[DateTime],
  revision: Long,
  updateType: String,
  storyBundleId: Option[String]
) extends WorkflowNotification

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
      (__ \ "content" \ "mainMediaType").readNullable[String] ~
      (__ \ "content" \ "type").read[String] ~
      (__ \ "whatChanged").read[String] ~
      (__ \ "published").read[Boolean] ~
      readUser ~
      (__ \ "content" \ "lastModified").read[Long].map(t => new DateTime(t)) ~
      readTagSections ~
      (__ \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
      (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
        s => s.exists(_=="true")
      } ~
      (__ \ "content" \ "lastMajorRevisionDate").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
      (__ \ "content" \ "publicationDate").readNullable[Long].map(timeOpt => timeOpt.map(t => new DateTime(t))) ~
      (__ \ "content" \ "revision").read[Long] ~
      (__ \ "content" \ "updateType").read[String] ~
      (__ \ "content" \ "identifiers" \ "storyBundleId").readNullable[String]
      )(WireStatus.apply _)

}
