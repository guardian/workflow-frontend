package models

import models.Status._
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

  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
      (__ \ "path").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "contentType").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModified").read[Long].map { t => new DateTime(t) } ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[Long].map( _.map( t => new DateTime(t)))
      )(WorkflowContent.apply _)
}
