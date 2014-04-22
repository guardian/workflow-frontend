package models

import play.api.libs.json.{JsValue, Reads}
import org.joda.time.DateTime

case class Contributor(name: String)

object Contributor {
  implicit val contributorReads: Reads[Contributor] = new Reads[Contributor] {
    def reads(jsValue: JsValue) = (jsValue \ "internalName").validate[String].map(Contributor(_))
  }
}

case class EditorDesk(name: String) {
  override def toString = name
}

object EditorDesk {
  implicit val deskReads: Reads[EditorDesk] = new Reads[EditorDesk] {
    def reads(jsValue: JsValue) = (jsValue \ "tag" \ "section" \ "name").validate[String].map(EditorDesk(_))
  }
}

case class WorkflowContent(
  workingTitle: Option[String],
  contributors: List[Contributor],
  path: String,
  published: Boolean,
  whatChanged: String,
  user: Option[String],
  lastModified: DateTime,
  desk: Option[EditorDesk],
  status: WorkflowStatus)

import play.api.libs.json._
import play.api.libs.functional.syntax._

object WorkflowContent {

  val readContributors = new Reads[List[Contributor]] {
    def reads(json: JsValue): JsResult[List[Contributor]] =
      (json \ "content" \ "taxonomy" \ "contributors")
        .validate[Option[List[Contributor]]]
        .map(_.toList.flatten)
  }

  val readTags = new Reads[Option[EditorDesk]] {
    def reads(json: JsValue): JsResult[Option[EditorDesk]] =
      (json \ "content" \ "taxonomy" \ "tags").validate[Option[List[EditorDesk]]]
      .map(_.toList.flatten.headOption)
  }
  def readUser = new Reads[Option[String]] {
    def reads(json: JsValue): JsResult[Option[String]] =
      for {
        firstOpt <- (json \ "content" \ "lastModifiedBy" \ "firstName").validate[Option[String]]
        lastOpt  <- (json \ "content" \ "lastModifiedBy" \ "lastName").validate[Option[String]]
      }
      yield firstOpt.flatMap(f => lastOpt.map(l => f + " " + l))
  }

  implicit val workflowContentReads: Reads[WorkflowContent] =
    ( readContributors ~
      (__ \ "content" \ "identifiers" \ "path").read[String] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "whatChanged").read[String] ~
      readUser ~
      (__ \ "content" \ "lastModified").read[Long].map(t => new DateTime(t)) ~
      readTags ~
      (__ \ "published").read[Boolean].map(p => if (p) Published else Created)
      )(WorkflowContent.apply(None, _, _, _, _, _, _, _, _))
}

sealed trait WorkflowStatus

case object Created   extends WorkflowStatus
case object Desk      extends WorkflowStatus
case object Subbed    extends WorkflowStatus
case object Published extends WorkflowStatus


object WorkflowStatus {
  def findWorkFlowStatus(status: String): Option[WorkflowStatus] = {
    status match {
      case "created" => Some(Created)
      case "desk" => Some(Desk)
      case "subbed" => Some(Subbed)
      case "published" => Some(Published)
      case _ => None
    }
  }
}
