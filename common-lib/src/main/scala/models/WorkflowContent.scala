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
                            contentType: String,
                            section: Option[Section],
                            status: Status,
                            lastModified: DateTime,
                            lastModifiedBy: Option[String],
                            commentable: Boolean,
                            published: Boolean,
                            timePublished: Option[DateTime]
                            ) {

  def updateWith(wireStatus: WireStatus): WorkflowContent =
    copy(
      section = wireStatus.tagSections.headOption,
      status = if (wireStatus.published) Final else status,
      lastModified =  wireStatus.lastModified,
      lastModifiedBy = wireStatus.user,
      published = wireStatus.published
    )
}

object WorkflowContent {

  implicit val dateTimeFormat = DateFormat

  def fromWireStatus(wireStatus: WireStatus, stub: Stub): WorkflowContent = {
    WorkflowContent(
      wireStatus.composerId,
      wireStatus.path,
      wireStatus.headline,
      wireStatus.`type`,
      wireStatus.tagSections.headOption,
      wireStatus.status, // not written to the database but the DTO requires a value.
      wireStatus.lastModified,
      wireStatus.user,
      commentable=wireStatus.commentable,
      published = wireStatus.published,
      timePublished = wireStatus.publicationDate
    )
  }

  def fromContentRow(row: Schema.ContentRow): WorkflowContent = row match {
    case (composerId, path, lastMod, lastModBy, status, contentType, commentable,
          headline, published, timePublished, _) =>
          WorkflowContent(
            composerId, path, headline, contentType, None, Status(status), lastMod,
            lastModBy, commentable, published, timePublished
          )
  }
  def newContentRow(wc: WorkflowContent, revision: Option[Long]): Schema.ContentRow =
    (wc.composerId, wc.path, wc.lastModified, wc.lastModifiedBy, wc.status.name,
     wc.contentType, wc.commentable, wc.headline, wc.published, None, revision)

  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
      (__ \ "path").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "contentType").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModified").read[DateTime] ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[DateTime]
      )(WorkflowContent.apply _)
}
