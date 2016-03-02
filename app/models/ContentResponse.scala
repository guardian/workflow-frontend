package models

import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._

case class ContentResponse(content: Map[String, List[ContentItem]], stubs: List[Stub], count: Map[String, Int])

object ContentResponse {

  def statusCountsMap(cis: List[ContentItem]): Map[String, Int] = {
    val statusToCount = cis.groupBy(ci => ci.wcOpt.map(_.status)).collect({case (Some(s), cis) => (s.name, cis.length)})
    val stubCount = cis.collect({case ContentItem(s: Stub, None) => s}).length
    val totalCount = cis.length
    statusToCount ++ Map("Stub" -> stubCount) ++ Map("total" -> totalCount)
  }

  def contentGroupedByStatus(cis: List[ContentItem]): Map[String, List[ContentItem]] = {
    cis.groupBy(ci => ci.wcOpt.map(_.status)).collect({case (Some(s), cis) => (s.name, cis)})
  }

  def fromContentItems(cis: List[ContentItem]): ContentResponse = {
    //contentItems are serialised to stubs and dashboardRows as JSON response handles these different.
    val stubs = cis.collect({case ContentItem(s: Stub, None) => s})
    ContentResponse(contentGroupedByStatus(cis), stubs, statusCountsMap(cis))

  }

  implicit def mapWrites[A: Writes]: Writes[Map[String, A]] = new Writes[Map[String, A]] {
    def writes(map: Map[String, A]): JsValue =
      Json.obj(map.map{case (s, o) =>
        val ret: (String, JsValueWrapper) = s -> Json.toJson(o)
        ret
      }.toSeq:_*)
  }

  implicit val contentResponseFormat = Json.writes[ContentResponse]
}
