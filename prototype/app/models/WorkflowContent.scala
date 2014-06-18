package models

import play.api.libs.json._
import org.joda.time.DateTime
import models.Status._
import play.api.libs.functional.syntax._
import org.joda.time.format.ISODateTimeFormat
import play.api.data.validation.ValidationError

case class Stub(id: Option[Long],
                title: String,
                section: String,
                due: Option[DateTime],
                assignee: Option[String],
                composerId: Option[String],
                contentType: Option[String])

object Stub {
  implicit val dateTimeFormat = DateFormat
  implicit val stubReads: Reads[Stub] = Json.reads[Stub]
  implicit val stubWrites: Writes[Stub] = Json.writes[Stub]

  object DateFormat extends Format[DateTime] {
    def writes(d: DateTime): JsValue = JsString(d.toString)
    def reads(json: JsValue): JsResult[DateTime] = {
      json.validate[String].flatMap { dt =>
        try { JsSuccess(ISODateTimeFormat.dateTimeParser().parseDateTime(dt)) }
        catch { case e: IllegalArgumentException =>
          JsError(ValidationError("validate.error.expected.date.isoformat",dt))
        }
      }
    }
  }
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
          d.wc.headline.map("headline" -> JsString(_)) ++
          d.stub.due.map(d => "due" -> JsNumber(d.getMillis)) ++
          d.stub.assignee.map("assignee" -> JsString(_)) ++
          d.stub.id.map("stubId" -> JsNumber(_)) ++
          Some("contentType" -> JsString(d.wc.contentType)) ++
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




