package models.api

import models._
import play.api.libs.json._
import org.joda.time.DateTime


// types used for serialising requests and responses to and from the datastore API

case class DeskAndSection(sectionId: Long, deskId: Long)
object DeskAndSection { implicit val jsonFormats = Json.format[DeskAndSection] }

case class SectionsInDeskMapping (deskId: Long, sectionIds: List[Long])
object SectionsInDeskMapping {
  implicit val sectionsInDeskJSONFormat = Json.format[SectionsInDeskMapping]
}

case class SectionRelation(desk: Desk, sections: List[Section])
object SectionRelation { implicit val jsonFormats = Json.format[SectionRelation] }

case class DeleteResult(composerCount: Int, stubCount: Int)
object DeleteResult { implicit val jsonFormats = Json.format[DeleteResult] }

case class TakedownRequest(composerId: String, t: Option[DateTime])
object TakedownRequest { implicit val jsonFormats = Json.format[TakedownRequest]}

// this is an exact duplicate of the ContentUpdateEvent but that's because it's parsed differently
// and this is used to send an event to the datastore API and get a response
case class ContentUpdateSerialisedEvent (
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
)
object ContentUpdateSerialisedEvent {
  def extract(ce: ContentUpdateEvent): ContentUpdateSerialisedEvent = {
    ContentUpdateSerialisedEvent(
      composerId = ce.composerId,
      path = ce.path,
      headline = ce.headline,
      standfirst = ce.standfirst,
      trailText = ce.trailText,
      mainMedia = ce.mainMedia,
      whatChanged = ce.whatChanged,
      published = ce.published,
      user = ce.user,
      lastModified = ce.lastModified,
      tags = ce.tags,
      lastMajorRevisionDate = ce.lastMajorRevisionDate,
      publicationDate = ce.publicationDate,
      thumbnail = ce.thumbnail,
      storyBundleId = ce.storyBundleId,
      revision = ce.revision,
      wordCount = ce.wordCount,
      launchScheduleDetails = ce.launchScheduleDetails,
      collaborators = ce.collaborators,
      statusFlags = ce.statusFlags
    )
  }
  implicit val jsonFormats = Json.format[ContentUpdateSerialisedEvent]
}

case class UpdateContentRequest(e: ContentUpdateSerialisedEvent, wcOpt: Option[WorkflowContent])
object UpdateContentRequest { implicit val jsonFormats = Json.format[UpdateContentRequest] }

