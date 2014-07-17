package models

import play.api.libs.json._


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
          Some("priority" -> JsNumber(d.stub.priority)) ++
          Some("contentType" -> JsString(d.wc.contentType)) ++
          Some("section" -> JsString(d.stub.section)) ++
          Some("status" -> JsString(d.wc.status.toString)) ++
          Some("lastModified" -> JsNumber(d.wc.lastModified.getMillis)) ++
          d.wc.lastModifiedBy.map("lastModifiedBy" -> JsString(_)) ++
          Some("commentable" -> JsBoolean(d.wc.commentable)) ++
          Some("published" -> JsBoolean(d.wc.published)) ++
          Some("needsLegal" -> JsString(d.stub.needsLegal.toString)) ++
          d.stub.note.map("note" -> JsString(_))
        )
    }
  }
}
