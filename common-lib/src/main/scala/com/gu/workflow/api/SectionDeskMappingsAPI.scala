package com.gu.workflow.api

import models.api.{ApiResponseFt, DeskAndSection, SectionsInDeskMapping}
import models.{Desk, Section}
import io.circe.syntax._
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global

class SectionDeskMappingsAPI(
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils with WSUtils {

  def getSectionsInDesks: ApiResponseFt[List[SectionsInDeskMapping]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("sectionDeskMapping/sectionsInDesk"))
      json <- parseBody(res.body)
      mappings <- extractDataResponse[List[SectionsInDeskMapping]](json)
    } yield mappings

  def assignSectionsToDesk(deskId: Long, sections: List[Long]): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sectionDeskMapping/assignSections", SectionsInDeskMapping(deskId, sections).asJson))
      json <- parseBody(res.body)
      dbRes <- extractDataResponse[Int](json)
    } yield dbRes

  def removeSectionMapping(id: Long): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionDeskMapping/section/$id"))
      json <- parseBody(res.body)
      dbRes <- extractDataResponse[Int](json)
    } yield dbRes

  def removeDeskMapping(id: Long): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionDeskMapping/desk/$id"))
      json <- parseBody(res.body)
      dbRes <- extractDataResponse[Int](json)
    } yield dbRes

  def getSectionsWithRelation(desk: Desk, sections: List[Section]): ApiResponseFt[List[Section]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"sectionDeskMapping/by-id/${desk.id}"))
      json <- parseBody(res.body)
      mappings <- extractDataResponse[List[DeskAndSection]](json)
      sectionIdsInDesk = mappings.map(_.sectionId)
    } yield showSelectedDesks(sectionIdsInDesk, sections)

  def showSelectedDesks(listOfSectionIdsInDesk: List[Long], sections: List[Section]): List[Section] =
    sections.map(section => if(listOfSectionIdsInDesk.contains(section.id)) section.copy(selected=true) else section.copy(selected=false))
}
