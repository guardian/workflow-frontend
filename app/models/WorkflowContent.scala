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
  headline: Option[String],
  `type`: String,
  section: Option[Section],
  status: Status,
  lastModified: DateTime,
  lastModifiedBy: Option[String],
  commentable: Boolean,
  published: Boolean
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
      if (wireStatus.published) Final else Writers,
      wireStatus.lastModified,
      wireStatus.user,
      commentable=wireStatus.commentable,
      published = wireStatus.published
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
      (__ \ "headline").readNullable[String] ~
      (__ \ "type").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModified").read[Long].map { t => new DateTime(t) } ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "published").read[Boolean]
    )(WorkflowContent.apply _)
}

case class DashboardRow(stub: Stub, wc: WorkflowContent)


object DashboardRow {
  implicit val dashboardRowWrites = new Writes[DashboardRow] {

    def writes(d: DashboardRow) = {
      JsObject(
        Seq[(String, JsValue)]() ++
          Some("composerId" -> JsString(d.wc.composerId)) ++
          d.wc.path.map("path" -> JsString(_)) ++
          Some("workingTitle" -> JsString(d.stub.title)) ++
          d.stub.due.map(d => "due" -> JsNumber(d.getMillis)) ++
          d.stub.assignee.map("assignee" -> JsString(_)) ++
          Some("contentType" -> JsString(d.wc.`type`)) ++
          Some("section" -> JsString(d.stub.section)) ++
          Some("status" -> JsString(d.wc.status.toString)) ++
          Some("lastModified" -> JsNumber(d.wc.lastModified.getMillis)) ++
          d.wc.lastModifiedBy.map("lastModifiedBy" -> JsString(_)) ++
          Some("commentable" -> JsBoolean(d.wc.commentable)) ++
          Some("published" -> JsBoolean(d.wc.published))
        )
    }
  }
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
