package models

import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._

//TODO - deprecate dashboard row in favour of ContentItem when the UI moves on to the API method

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

  //todo - add unit test
  def toContentItem(d: DashboardRow) = ContentItem(d.stub, Some(d.wc))

}

case class PublishedData(composerId: String, published: Boolean, publishedTime: Option[DateTime])

case class User(email: String, firstName: String, lastName: String)

object User {
  implicit val userFormats = Json.format[User]
}

case class ChangeRecord(date: DateTime, user: User)

object ChangeRecord  {

  implicit val changeRecordReads = new Reads[ChangeRecord] {
    def reads(json: JsValue): JsResult[ChangeRecord] = {
      for {
        date <- (json \ "date").validate[Long].map(t => new DateTime(t))
        user <- (json \ "user").validate[User]
      } yield {
        ChangeRecord(date,user)
      }
    }
  }
}

object PublishedData {

  def readChangeRecordTime(json: JsValue, recordType: String): JsResult[Option[DateTime]] = {
      (json \ "contentChangeDetails" \ "data" \ recordType).validate[ChangeRecord] match {
        case JsSuccess(changeRecord, _) => JsSuccess(Some(changeRecord.date))
        case JsError(_) => JsSuccess(None)
      }
  }

  implicit val composerApiReads = new Reads[PublishedData] {
    def reads(json: JsValue): JsResult[PublishedData] = {
      for {
        composerId <- (json \ "id").validate[String]
        published <- (json \ "published").validate[Boolean]
        publishedTime <- readChangeRecordTime(json, "published")
      } yield PublishedData(composerId, published, publishedTime)
    }
  }
}

case class ContentResponse(stubs: List[Stub], content: Map[String, List[DashboardRow]], count: Map[String, Int])

object ContentResponse {

  def statusCountsMap(cis: List[ContentItem]): Map[String, Int] = {
    val statusToCount = cis.groupBy(ci => ci.wcOpt.map(_.status)).collect({case (Some(s), cis) => (s.name, cis.length)})
    val stubCount = cis.collect({case ContentItem(s: Stub, None) => s}).length
    val totalCount = cis.length
    statusToCount ++ Map("Stub" -> stubCount) ++ Map("total" -> totalCount)
  }

  def contentGroupedByStatus(cis: List[ContentItem]): Map[String, List[DashboardRow]] = {
    val dashboardRows = cis.collect({case ContentItem(s: Stub, Some(wc: WorkflowContent)) => DashboardRow(s, wc)})
    dashboardRows.groupBy(_.wc.status).map({case(s,cs) => (s.name, cs.toList)})
  }

  def fromContentItems(cis: List[ContentItem]): ContentResponse = {
    //contentItems are serialised to stubs and dashboardRows as JSON response handles these different.
    val stubs = cis.collect({case ContentItem(s: Stub, None) => s})
    ContentResponse(stubs, contentGroupedByStatus(cis), statusCountsMap(cis))

  }

  implicit def mapWrites[A: Writes]: Writes[Map[Int, A]] = new Writes[Map[Int, A]] {
    def writes(map: Map[Int, A]): JsValue =
      Json.obj(map.map{case (s, o) =>
        val ret: (String, JsValueWrapper) = s.toString -> Json.toJson(o)
        ret
      }.toSeq:_*)
  }

  implicit val contentResponseFormat = Json.writes[ContentResponse]
}
