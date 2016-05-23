package com.gu.workflow.api

import models.api.DeskAndSection
import models.{ Desk, Section }
import models.api.SectionsInDeskMapping
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import models.api.{ApiResponseFt}
import com.gu.workflow.api.ApiUtils._


object SectionDeskMappingsAPI {

  def getSectionsInDesks(): ApiResponseFt[List[SectionsInDeskMapping]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest("sectionDeskMapping/sectionsInDesk"))
      mappings <- extractDataResponse[List[SectionsInDeskMapping]](res.json)
    } yield {
      mappings
    }
  }

  def assignSectionsToDesk(deskId: Long, sections: List[Long]): ApiResponseFt[Int] = {
    val assign = SectionsInDeskMapping(deskId, sections)
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sectionDeskMapping/assignSections",
        Json.toJson(assign)))
      dbRes <- extractDataResponse[Int](res.json)
    } yield {
      dbRes
    }
  }

  def removeSectionMapping(id: Long): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionDeskMapping/section/$id"))
      dbRes <- extractDataResponse[Int](res.json)
    } yield {
      dbRes
    }
  }

  def removeDeskMapping(id: Long): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"sectionDeskMapping/desk/$id"))
      dbRes <- extractDataResponse[Int](res.json)
    } yield {
      dbRes
    }
  }

  def getSectionsWithRelation(desk: Desk, sections: List[Section]):
      ApiResponseFt[List[Section]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"sectionDeskMapping/by-id/${desk.id}"))
      mappings <- extractDataResponse[List[DeskAndSection]](res.json)
      sectionIdsInDesk = mappings.map(_.sectionId).toList
    } yield {
      showSelectedDesks(sectionIdsInDesk, sections)
    }
  }

  def showSelectedDesks(listOfSectionIdsInDesk: List[Long], sections: List[Section]): List[Section] = {
    sections.map(section => if(listOfSectionIdsInDesk.contains(section.id)) section.copy(selected=true) else section.copy(selected=false))
  }

}
