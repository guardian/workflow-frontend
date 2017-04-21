package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import models.Stub
import models.Flag.Flag
import models.api._
import org.joda.time.DateTime
import play.api.Play.current
import play.api.libs.json._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

object PrototypeAPI {

  def createContent(body: JsValue): ApiResponseFt[ContentUpdate] = {
    for {
      convertedJson <- flatStubJsonToStubJson(body)
      res <- ApiResponseFt.Async.Right(postRequest("stubs", convertedJson))
      createRes <- extractDataResponse[ContentUpdate](res.json)
    } yield {
      createRes
    }
  }

  def putStub(stubId: Long, body: JsValue): ApiResponseFt[ContentUpdate] = {
    for {
      convertedJson <- flatStubJsonToStubJson(body)
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId", convertedJson))
      putRes <- extractDataResponse[ContentUpdate](res.json)
    } yield {
      putRes
    }
  }

  def getContentByStubId(id: Long): ApiResponseFt[Option[Stub]] = {
    for {
      req <- ApiResponseFt.Async.Right(getRequest(s"stubs/$id"))
      item <- extractDataResponseOpt[Stub](req.json)
    } yield {
      item
    }
  }


  def putStubDue(id: Long, date: Option[DateTime]) = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/${id}/dueDate", Json.toJson(date)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubNote(id: Long, note: Option[String]) = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/${id}/note", Json.toJson(note)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item

    }
  }

  def putStubAssignee(id: Long, assignee: Option[String]): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assignee",
        Json.toJson(assignee)))
      putRes <- extractDataResponse[Long](req.json)
    } yield {
      putRes
    }
  }

  def putStubAssigneeEmail(id: Long, assigneeEmail: Option[String]): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assigneeEmail",
        Json.toJson(assigneeEmail)))
      putRes <- extractDataResponse[Long](req.json)
    } yield {
      putRes

    }
  }

  def putStubProdOffice(id: Long, status: String): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/prodOffice",
        Json.toJson(status)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubTrashed(id: Long, trashed: Boolean): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/updateTrashed",
        Json.toJson(trashed)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubLegalStatus(id: Long, status: Flag): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/needsLegal", Json.toJson(status)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubPriority(id: Long, priority: Int): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/priority",
        Json.toJson(priority)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubSection(id: Long, section: String): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/section", Json.toJson(section)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }

  def putStubWorkingTitle(id: Long, wt: String): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/updateWorkingTitle", Json.toJson(wt)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }


  def deleteContentByStubId(id: Long): ApiResponseFt[Option[DeleteOp]] = {
    for {
      req <- ApiResponseFt.Async.Right(deleteRequest(s"stubs/$id"))
      res <- extractDataResponseOpt[DeleteOp](req.json)
    } yield {
      res
    }
  }

  def updateContentStatus(stubId: Long, status: String): ApiResponseFt[Long] = {
    for {
      req <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/status",
        Json.toJson(status)))
      item <- extractDataResponse[Long](req.json)
    } yield {
      item
    }
  }
}
