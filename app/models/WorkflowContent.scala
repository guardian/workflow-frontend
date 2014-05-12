package models

import play.api.libs.json._
import org.joda.time.DateTime
import java.util.UUID
import models.Status._

case class Stub(id: String,
                title: String,
                section: String,
                due: Option[DateTime],
                assignee: Option[String],
                composerId: Option[String])

object Stub {

  implicit val uuidWrites = new Writes[UUID] {
    override def writes(id: UUID): JsValue = JsString(id.toString)
  }
  implicit val uuidReads = new Reads[UUID] {
    override def reads(jsValue: JsValue) = (jsValue \ "id").validate[String].map(UUID.fromString(_))
  }

  implicit val stubReads: Reads[Stub] = Json.reads[Stub]
  implicit val stubWrites: Writes[Stub] = Json.writes[Stub]
}

case class Contributor(name: String)

object Contributor {
  implicit val contributorReads: Reads[Contributor] = new Reads[Contributor] {
    def reads(jsValue: JsValue) = (jsValue \ "internalName").validate[String].map(Contributor(_))
  }

  implicit val contributorWrites: Writes[Contributor] = Json.writes[Contributor]
}

case class WireStatus(
  composerId: String,
  contributors: List[Contributor],
  path: String,
  headline: Option[String],
  slug: Option[String],
  `type`: String,
  published: Boolean,
  whatChanged: String,
  user: Option[String],
  lastModified: DateTime,
  tagSections: List[Section],
  status: Status)

case class WorkflowContent(
  id: UUID,
  composerId: String,
  path: Option[String],
  workingTitle: Option[String],
  headline: Option[String],
  slug: Option[String],
  `type`: String,
  contributors: List[Contributor],
  section: Option[Section],
  status: Status,
  lastModification: Option[ContentModification],
  scheduledLaunch: Option[DateTime],
  stateHistory: Map[Status, String] = Map.empty,
  fromFeed: Boolean) {

  def updateWith(wireStatus: WireStatus): WorkflowContent =
    copy(
      contributors = wireStatus.contributors,
      section = wireStatus.tagSections.headOption,
      status = if (wireStatus.published) Final else status,
      lastModification = Some(ContentModification(
        whatChanged = wireStatus.whatChanged,
        dateTime = wireStatus.lastModified,
        user = wireStatus.user
      ))
    )
}

object WorkflowContent {
  import java.util.UUID

  def fromWireStatus(wireStatus: WireStatus): WorkflowContent = {
    WorkflowContent(
      UUID.randomUUID(),
      wireStatus.composerId,
      Some(wireStatus.path),
      None,
      wireStatus.headline,
      wireStatus.slug,
      wireStatus.`type`,
      wireStatus.contributors,
      wireStatus.tagSections.headOption,
      if (wireStatus.published) Final else Writers,
      Some(ContentModification(wireStatus.whatChanged, wireStatus.lastModified, wireStatus.user)),
      scheduledLaunch=None,
      fromFeed=true
    )
  }

  implicit val uuidWrites = new Writes[UUID] {
    override def writes(id: UUID): JsValue = JsString(id.toString)
  }
  implicit val stateHistory = new Writes[Map[Status, String]] {
    override def writes(hist: Map[Status, String]): JsValue = {
      JsObject(
        (for((k,v)<-hist) yield (k.toString, JsString(v))).toSeq
      )
    }
  }
  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

}

case class ContentModification(
  whatChanged: String,
  dateTime: DateTime,
  user: Option[String])

object ContentModification {
  implicit val contentModWrites: Writes[ContentModification] = Json.writes[ContentModification]
}

  import play.api.libs.json._
  import play.api.libs.functional.syntax._

object WireStatus {

  val readContributors = new Reads[List[Contributor]] {
    def reads(json: JsValue): JsResult[List[Contributor]] =
      (json \ "content" \ "taxonomy" \ "contributors")
        .validate[Option[List[Contributor]]]
        .map(_.toList.flatten)
  }

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
      readContributors ~
      (__ \ "content" \ "identifiers" \ "path").read[String] ~
      (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
      (__ \ "content" \ "fields" \ "slug").readNullable[String] ~
      (__ \ "content" \ "type").read[String] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "whatChanged").read[String] ~
      readUser ~
      (__ \ "content" \ "lastModified").read[Long].map(t => new DateTime(t)) ~
      readTagSections ~
      (__ \ "published").read[Boolean].map(p => if (p) Final else Writers)
      )(WireStatus.apply _)

}
