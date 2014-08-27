package models

import play.api.Logger
import play.api.libs.json._

case class DashboardRow(stub: Stub, wc: WorkflowContent)

object DashboardRow {
  implicit val dashboardRowWrites = new Writes[DashboardRow] {

    def writes(d: DashboardRow) = {
      /*
       * Our goal is to combine the data from two json objects into
       * one, according to a desired pattern. We could pick individual
       * values each source object and put them into the combined
       * target object. However, most of the fields we want can
       * actually be carried over unchanged from the source objects,
       * and the only modification we need to do is to rename some
       * repeated data. Here we codify the changes that will be
       * applied to the source objects as we copy them over.
       */
      def rename(oldPath: JsPath, newPath: JsPath): Reads[JsObject] =
        __.json.update(newPath.json.copyFrom(oldPath.json.pick)) andThen oldPath.json.prune

      val stubTransform = rename(__ \ "id", __ \ "stubId") andThen
        rename(__ \ "title", __ \ "workingTitle")

      /* convert the Scala object to Json, and then apply the transformation */
      (stubTransform reads (__.write[Stub].writes(d.stub))).get ++
        __.write[WorkflowContent].writes(d.wc)
    }
  }
}
