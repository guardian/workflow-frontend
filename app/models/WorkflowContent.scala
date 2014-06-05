package models

import play.api.libs.json._
import org.joda.time.DateTime
import models.Status._
import play.api.libs.functional.syntax._

case class Stub(id: Option[Long],
                title: String,
                section: String,
                due: Option[DateTime],
                assignee: Option[String],
                composerId: Option[String])

object Stub {
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
  path: Option[String],
  headline: Option[String],
  slug: Option[String],
  `type`: String,
  published: Boolean,
  whatChanged: String,
  user: Option[String],
  lastModified: DateTime,
  tagSections: List[Section],
  status: Status,
  commentable: Boolean)

case class WorkflowContent(
  composerId: String,
  path: Option[String],
  workingTitle: String,
  due: Option[DateTime],
  assignee: Option[String],
  headline: Option[String],
  slug: Option[String],
  `type`: String,
  contributors: List[Contributor],
  section: Option[Section],
  status: Status,
  lastModification: ContentModification,
  scheduledLaunch: Option[DateTime],
  commentable: Boolean,
  state: ContentState
) {

  def updateWith(wireStatus: WireStatus): WorkflowContent =
    copy(
      contributors = wireStatus.contributors,
      section = wireStatus.tagSections.headOption,
      status = if (wireStatus.published) Final else status,
      lastModification = ContentModification(
        whatChanged = wireStatus.whatChanged,
        dateTime = wireStatus.lastModified,
        user = wireStatus.user
      ),
      state = if (wireStatus.published) ContentState.Published else state
    )
}

object WorkflowContent {

  def fromWireStatus(wireStatus: WireStatus, stub: Stub): WorkflowContent = {
    WorkflowContent(
      wireStatus.composerId,
      wireStatus.path,
      stub.title,
      stub.due,
      stub.assignee,
      wireStatus.headline,
      wireStatus.slug,
      wireStatus.`type`,
      wireStatus.contributors,
      wireStatus.tagSections.headOption,
      if (wireStatus.published) Final else Writers,
      ContentModification(wireStatus.whatChanged, wireStatus.lastModified, wireStatus.user),
      scheduledLaunch=None,
      commentable=wireStatus.commentable,
      state = if (wireStatus.published) ContentState.Published else ContentState.Draft
    )
  }

  implicit val stateHistory = new Writes[Map[Status, String]] {
    override def writes(hist: Map[Status, String]): JsValue = {
      JsObject(
        (for((k,v)<-hist) yield (k.toString, JsString(v))).toSeq
      )
    }
  }
  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

  val readContributors = new Reads[List[Contributor]] {
    def reads(json: JsValue): JsResult[List[Contributor]] =
      (json \ "contributors")
        .validate[Option[List[Contributor]]]
        .map(_.toList.flatten)
  }
  import ContentState._
  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
     (__ \ "path").readNullable[String] ~
     (__ \ "workingTitle").read[String] ~
     (__ \ "due").readNullable[Long].map { _.map(t => new DateTime(t)) } ~
     (__ \ "assignee").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "slug").readNullable[String] ~
      (__ \ "type").read[String] ~
      readContributors ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModification").read[ContentModification] ~
      (__ \ "scheduledLaunch").readNullable[Long].map { _.map(t => new DateTime(t)) } ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "state").read[String].map { s => ContentState.fromString(s).getOrElse(Draft)}
    )(WorkflowContent.apply _)
}

case class ContentModification(
  whatChanged: String,
  dateTime: DateTime,
  user: Option[String])

object ContentModification {
  implicit val contentModWrites: Writes[ContentModification] = Json.writes[ContentModification]
  implicit val contentModReads: Reads[ContentModification] = Json.reads[ContentModification]
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
      (__ \ "content" \ "identifiers" \ "path").readNullable[String] ~
      (__ \ "content" \ "fields" \ "headline").readNullable[String] ~
      (__ \ "content" \ "fields" \ "slug").readNullable[String] ~
      (__ \ "content" \ "type").read[String] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "whatChanged").read[String] ~
      readUser ~
      (__ \ "content" \ "lastModified").read[Long].map(t => new DateTime(t)) ~
      readTagSections ~
      (__ \ "published").read[Boolean].map(p => if (p) Final else Writers) ~
      (__ \ "content" \ "settings" \ "commentable").readNullable[String].map {
        s => s.exists(_=="true")
      }
      )(WireStatus.apply _)

}

sealed trait ContentState

object ContentState {
  case object Draft extends ContentState
  case object Published extends ContentState

  def fromString(s: String): Option[ContentState] = s match {
    case "draft" => Some(Draft)
    case "published" => Some(Published)
    case _ => None
  }

  implicit val contentStateWrites: Writes[ContentState] = new Writes[ContentState] {
    def writes(o: ContentState): JsValue =
      JsString(o match {
        case Draft => "draft"
        case Published => "published"
      })
  }

}
