package com.gu.workflow.api

import java.net.URLEncoder

import io.circe.syntax._
import models.api.ApiResponseFt
import models.{Section, SerialisedSection}
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global

class SectionsAPI(
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils {

  def getSections: ApiResponseFt[List[Section]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"sections/list"))
      json <- parseBody(res.body)
      serialisedSections <- extractDataResponse[List[SerialisedSection]](json)
      sections = serialisedSections.map(Section.fromSerialised)
    } yield sections

  def upsertSection(section: Section): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/upsert", section.asJson))
      json <- parseBody(res.body)
      upsertRes <- extractDataResponse[Int](json)
    } yield upsertRes

  def removeSection(section: Section): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/remove", section.asJson))
      json <- parseBody(res.body)
      removeRes <- extractDataResponse[Int](json)
    } yield removeRes

  // Sections Tags Mapping

  def insertSectionTag(sectionId: Long, tagId: String): Unit =
    for {
      res <- ApiResponseFt.Async.Right(buildRequest(s"sectionTagMapping/$sectionId/${URLEncoder.encode(tagId, "UTF-8")}").put(""))
      json <- parseBody(res.body)
      insertRes <- extractDataResponse[Int](json)
    } yield insertRes

  def removeSectionTag(sectionId: Long, tagId: String): Unit =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionTagMapping/$sectionId/${URLEncoder.encode(tagId, "UTF-8")}"))
      json <- parseBody(res.body)
      removeRes <- extractDataResponse[Int](json)
    } yield removeRes

  def getTagsForSectionFt(sectionId: Long): ApiResponseFt[List[String]] =
    for {
        res <- ApiResponseFt.Async.Right(getRequest(s"sectionTagMapping/section/$sectionId"))
        json <- parseBody(res.body)
        tagIds <- extractDataResponse[List[String]](json)
    } yield tagIds
}
