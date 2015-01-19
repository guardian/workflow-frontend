package models

import com.gu.workflow.db.Schema
import org.joda.time.DateTime
import play.api.libs.json._

case class ArchiveContent(
  stubId:        Long,
  composerId:    Option[String],
  wasDeleted:    Boolean,
  workingTitle:  String,
  section:        String,
  contentType:   Option[String],
  prodOffice:    String,
  createdAt:     DateTime,
  lastModified:  DateTime,
  status:         String,
  headline:       Option[String],
  path:           Option[String],
  published:      Boolean,
  timePublished:  Option[DateTime],
  revision:       Option[Long],
  storyBundleId:  Option[String],
  activeInInCopy: Boolean,
  takenDown:      Boolean,
  timeTakenDown:  Option[DateTime]
)
case object ArchiveContent {
  def fromArchiveRow(row: Schema.ArchiveRow): ArchiveContent = row match {
    case(pk, stubId, composerId, wasDeleted, workingTitle, section, contentType, prodOffice,
      createdAt, lastModified, status, headline, path, published, timePublished, revision,
      storyBundleId, activeInInCopy, takenDown, timeTakenDown) =>
    ArchiveContent(stubId, composerId, wasDeleted, workingTitle, section, contentType, prodOffice,
      createdAt, lastModified, status, headline, path, published, timePublished, revision,
      storyBundleId, activeInInCopy, takenDown, timeTakenDown)
  }

  implicit val archiveContentWrites: Writes[ArchiveContent] = Json.writes[ArchiveContent]
}
