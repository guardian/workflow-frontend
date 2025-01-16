package models.api

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import models.Stub

case class ContentResponse(content: Map[String, List[Stub]], count: Map[String, Int])
object ContentResponse {
  implicit val encoder: Encoder[ContentResponse] = deriveEncoder
  implicit val decoder: Decoder[ContentResponse] = deriveDecoder
  implicit val flatStubEncoder: Encoder[Stub] = Stub.flatJsonEncoder
  
  def statusCountsMap(stubs: List[Stub]): Map[String, Int] = {
    val statusToCount: Map[String, Int] = stubs.groupBy(stub => stub.externalData.get.status).collect({case (s, sList) => (s.entryName, sList.length)})
    val totalCount: Int = stubs.length
    statusToCount ++ Map("total" -> totalCount)
  }

  def contentGroupedByStatus(stubs: List[Stub]): Map[String, List[Stub]] = {
    stubs.groupBy(stub => stub.externalData.get.status).collect({case (s, stubList) => (s.entryName, stubList)})
  }

  def fromStubItems(stubs: List[Stub]): ContentResponse =
    ContentResponse(contentGroupedByStatus(stubs), statusCountsMap(stubs))
}
