package com.gu.workflow.api

import models.{ Section, SerialisedSection }
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import models.api.{ApiResponseFt}
import com.gu.workflow.api.ApiUtils._

object SectionsAPI {
    def getSections(): ApiResponseFt[List[Section]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"sections/list"))
      serialisedSections <- extractDataResponse[List[SerialisedSection]](res.json)
      sections = serialisedSections.map(Section.fromSerialised(_))
    } yield {
      sections
    }
  }

  def upsertSection(section: Section): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/upsert", Json.toJson(section)))
      upsertRes <- extractDataResponse[Int](res.json)
    } yield {
      upsertRes
    }
  }

  def removeSection(section: Section): ApiResponseFt[Int] = {
    for {
      res <- ApiResponseFt.Async.Right(postRequest("sections/remove", Json.toJson(section)))
      removeRes <- extractDataResponse[Int](res.json)
    } yield {
      removeRes
    }
  }

}
