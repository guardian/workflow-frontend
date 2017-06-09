package models.api

import models.{Status, Stub}
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._

case class ContentResponse(content: Map[String, List[Stub]], stubs: List[Stub], count: Map[String, Int])

object ContentResponse {

  private def isStub(s: Stub): Boolean = s.externalData.get.status == Status.Stub


  def statusCountsMap(stubs: List[Stub]): Map[String, Int] = {
    val statusToCount: Map[String, Int] = stubs.groupBy(stub => stub.externalData.get.status).collect({case (s, sList) => (s.name, sList.length)})
    val stubCount: Int = stubs.count(isStub)
    val totalCount: Int = stubs.length
    statusToCount ++ Map("Stub" -> stubCount) ++ Map("total" -> totalCount)
  }

  def contentGroupedByStatus(stubs: List[Stub]): Map[String, List[Stub]] = {
    stubs.groupBy(stub => stub.externalData.get.status).collect({case (s, stubList) => (s.name, stubList)})
  }

  def fromStubItems(stubs: List[Stub]): ContentResponse =
    ContentResponse(contentGroupedByStatus(stubs), stubs.filter(isStub), statusCountsMap(stubs))

  implicit def mapWrites[A: Writes]: Writes[Map[String, A]] = new Writes[Map[String, A]] {
    def writes(map: Map[String, A]): JsValue =
      Json.obj(map.map{case (s, o) =>
        val ret: (String, JsValueWrapper) = s -> Json.toJson(o)
        ret
      }.toSeq:_*)
  }

  implicit val flatStubWrites: Writes[Stub] = Stub.flatStubWrites
  implicit val contentResponseFormat: Writes[ContentResponse] = Json.writes[ContentResponse]
  implicit val contentResponseReads: Reads[ContentResponse] = Json.reads[ContentResponse]
}
