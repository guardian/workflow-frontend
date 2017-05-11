package com.gu.workflow.api

import java.net.URLEncoder

import com.gu.workflow.api.ApiUtils._
import models.api.ApiResponseFt
import models.{Section, SerialisedSection}
import play.api.libs.json._

import scala.concurrent.ExecutionContext.Implicits.global

object SectionsAPI {

  // Sections

  def getSections: ApiResponseFt[List[Section]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"sections/list"))
      serialisedSections <- extractDataResponse[List[SerialisedSection]](res.json)
      sections = serialisedSections.map(Section.fromSerialised)
    } yield sections

  def upsertSection(section: Section): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/upsert", Json.toJson(section)))
      upsertRes <- extractDataResponse[Int](res.json)
    } yield upsertRes

  def removeSection(section: Section): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/remove", Json.toJson(section)))
      removeRes <- extractDataResponse[Int](res.json)
    } yield removeRes

  // Sections Tags Mapping

  def insertSectionTag(sectionId: Long, tagId: String): Unit =
    for {
      res <- ApiResponseFt.Async.Right(buildRequest(s"sectionTagMapping/$sectionId/${URLEncoder.encode(tagId, "UTF-8")}").put(""))
      insertRes <- extractDataResponse[Int](res.json)
    } yield insertRes

  def removeSectionTag(sectionId: Long, tagId: String): Unit =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionTagMapping/$sectionId/${URLEncoder.encode(tagId, "UTF-8")}"))
      removeRes <- extractDataResponse[Int](res.json)
    } yield removeRes

  def getTagsForSectionFt(sectionId: Long): ApiResponseFt[List[String]] =
    for {
        res <- ApiResponseFt.Async.Right(getRequest(s"sectionTagMapping/section/$sectionId"))
        tagIds <- extractDataResponse[List[String]](res.json)
    } yield tagIds
}
