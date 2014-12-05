package models

import models.Status._
import com.gu.workflow.db.Schema
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

case class WorkflowContent(
  composerId: String,
  path: Option[String],
  headline: Option[String],
  mainMedia: Option[String],
  contentType: String,
  section: Option[Section],
  status: Status,
  lastModified: DateTime,
  lastModifiedBy: Option[String],
  commentable: Boolean,
  published: Boolean,
  timePublished: Option[DateTime],
  storyBundleId: Option[String],
  activeInInCopy: Boolean,
  takenDown: Boolean,
  timeTakenDown: Option[DateTime]
)

object WorkflowContent {

  implicit val dateTimeFormat = DateFormat

  def fromContentUpdateEvent(e: ContentUpdate): Option[WorkflowContent] = {
    e match {
      case l: LiveContentUpdateEvent  => Some(
        fromLiveContentUpdateEvent(l.asInstanceOf[LiveContentUpdateEvent])
      )
      case d: DraftContentUpdateEvent => Some(
        fromDraftContentUpdateEvent(d.asInstanceOf[DraftContentUpdateEvent])  
      )
      case _ => None
    }
  }

  def fromLiveContentUpdateEvent(e: LiveContentUpdateEvent): WorkflowContent = {
    WorkflowContent(
      e.composerId,
      e.path,
      e.headline,
      None,
      e.`type`,
      e.tagSections.headOption,
      e.status, // not written to the database but the DTO requires a value.
      e.lastModified,
      e.user,
      commentable=e.commentable,
      published = e.published,
      timePublished = e.publicationDate,
      storyBundleId = e.storyBundleId,
      false, // assume not active in incopy
      takenDown = false,
      timeTakenDown = None
    )
  }

  def fromDraftContentUpdateEvent(e: DraftContentUpdateEvent): WorkflowContent = {
    WorkflowContent(
      e.composerId,
      e.path,
      e.headline,
      None,
      e.`type`,
      e.tagSections.headOption,
      e.status, // not written to the database but the DTO requires a value.
      e.lastModified,
      e.user,
      commentable=e.commentable,
      published = e.published,
      timePublished = e.publicationDate,
      storyBundleId = e.storyBundleId,
      false, // assume not active in incopy
      takenDown = false,
      timeTakenDown = None
    )

  }

  def fromContentRow(row: Schema.ContentRow): WorkflowContent = row match {
    case (composerId, path, lastMod, lastModBy, status, contentType, commentable,
          headline, mainMedia, published, timePublished, _, storyBundleId, activeInInCopy,
          takenDown, timeTakenDown) =>
          WorkflowContent(
            composerId, path, headline, mainMedia, contentType, None, Status(status), lastMod,
            lastModBy, commentable, published, timePublished, storyBundleId,
            activeInInCopy, takenDown, timeTakenDown)
  }
  def newContentRow(wc: WorkflowContent, revision: Option[Long]): Schema.ContentRow =
    (wc.composerId, wc.path, wc.lastModified, wc.lastModifiedBy, wc.status.name,
     wc.contentType, wc.commentable, wc.headline, wc.mainMedia, wc.published, wc.timePublished,
     revision, wc.storyBundleId, wc.activeInInCopy, false, None)

  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
      (__ \ "path").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "mainMedia").readNullable[String] ~
      (__ \ "contentType").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModified").read[DateTime] ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[DateTime] ~
      (__ \ "storyBundleId").readNullable[String] ~
      (__ \ "activeInIncopy").read[Boolean] ~
      (__ \ "takenDown").read[Boolean] ~
      (__ \ "timeTakenDown").readNullable[DateTime]
      )(WorkflowContent.apply _)
}
