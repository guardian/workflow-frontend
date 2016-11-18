package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

sealed trait WorkflowNotification

case class ContentUpdateEvent (
  composerId: String,
  path: Option[String],
  headline: Option[String],
  standfirst: Option[String],
  trailText: Option[String],
  mainMedia: WorkflowContentMainMedia,
  whatChanged: String,
  published: Boolean,
  user: Option[String],
  lastModified: DateTime,
  tags: Option[List[TagUsage]],
  lastMajorRevisionDate: Option[DateTime],
  publicationDate: Option[DateTime],
  thumbnail: Option[String],
  storyBundleId: Option[String],
  revision: Long,
  wordCount: Int,
  launchScheduleDetails: LaunchScheduleDetails,
  collaborators: List[User],
  statusFlags: WorkflowContentStatusFlags
) extends WorkflowNotification

object ContentUpdateEvent {
  import Status._

  implicit val userReads: Reads[User] = (
    (__ \ "email").read[String] ~
    (__ \ "firstName").read[String] ~
    (__ \ "lastName").read[String]
  )(User.apply _)

  implicit val assetReads: Reads[Asset] = Json.reads[Asset]
  implicit val elementReads: Reads[Element] = Json.reads[Element]
  implicit val thumbnailReads: Reads[Thumbnail] = Json.reads[Thumbnail]
  implicit val blockReads: Reads[Block] = (
    (__ \ "id").read[String] ~
    (__ \ "lastModified").read[Long].map(t => new DateTime(t)) ~
    (__ \ "elements").read[List[Element]]
  )(Block.apply _)

  implicit val contentUpdateEventReads: Reads[ContentUpdateEvent] = (
    (__ \ "content" \ "id").read[String] ~
    (__ \ "content" \ "identifiers").read[Map[String, String]].map(m => m.get("path")) ~
    (__ \ "content" \ "fields").read[Map[String, String]].map(m => m.get("headline")) ~
    (__ \ "content" \ "fields").read[Map[String, String]].map(m => m.get("standfirst")) ~
    (__ \ "content" \ "fields").read[Map[String, String]].map(m => m.get("trailText")) ~
      (__ \ "content" \ "mainBlock").readNullable[Block].map(blockOpt => WorkflowContentMainMedia.getMainMedia(blockOpt)) ~
    (__ \ "whatChanged").read[String] ~
    (__ \ "content" \ "published").read[Boolean] ~
    readUser ~
    (__ \ "content" \ "contentChangeDetails" \ "lastModified" \ "date").read[Long].map(t => new DateTime(t)) ~
    (__ \ "content" \ "taxonomy").readNullable(
      (__ \ "tags").read[List[TagUsage]]
    ) ~
    (__ \ "content" \ "contentChangeDetails" \ "lastMajorRevisionPublished").readNullable(
      (__ \ "date").read[Long].map(t => new DateTime(t))
    ) ~
    (__ \ "content" \ "contentChangeDetails" \ "published").readNullable(
      (__ \ "date").read[Long].map(t => new DateTime(t))
    ) ~
    (__ \ "content" \ "thumbnail").readNullable[Thumbnail].map(thumbnailOpt => WorkflowContent.getTrailImageUrl(thumbnailOpt)) ~
    (__ \ "content" \ "identifiers" \ "storyBundleId").readNullable[String] ~
    (__ \ "content" \ "contentChangeDetails" \ "revision").readNullable[Long].map(optLong => optLong.getOrElse(0L)) ~
    (__ \ "content" \ "wc").read[Int] ~
    (__ \ "content").read[LaunchScheduleDetails](LaunchScheduleDetails.launchScheduleDetailsSQSReads) ~
    (__ \ "content" \ "collaborators").read[List[User]] ~
    (__ \ "content").read[WorkflowContentStatusFlags](WorkflowContentStatusFlags.workflowContentStatusFlagsSqsNotificationReads)
    )(ContentUpdateEvent.apply _)

  def readUser = new Reads[Option[String]] {
    def reads(json: JsValue): JsResult[Option[String]] =
      for {
        firstOpt <- (json \ "content" \ "contentChangeDetails" \ "lastModified" \ "user" \ "firstName").validateOpt[String]
        lastOpt  <- (json \ "content" \ "contentChangeDetails" \ "lastModified" \ "user" \ "lastName").validateOpt[String]
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
