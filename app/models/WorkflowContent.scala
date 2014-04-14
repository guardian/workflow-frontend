package models

import play.api.libs.json.{JsValue, Reads}

case class Contributor(name: String)

object Contributor {
  implicit val contributorReads: Reads[Contributor] = new Reads[Contributor] {
    def reads(jsValue: JsValue) = (jsValue \ "internalName").validate[String].map(Contributor(_))
  }
}

case class WorkflowContent(contributors: List[Contributor], path: String, published: Boolean, whatChanged: String)

import play.api.libs.json._
import play.api.libs.functional.syntax._
object WorkflowContent {
  implicit val workflowContentReads: Reads[WorkflowContent] =
    ((__ \ "content" \ "taxonomy" \ "contributors").read[List[Contributor]] ~
      (__ \ "content" \ "identifiers" \ "path").read[String] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "whatChanged").read[String])(WorkflowContent.apply _)
}
