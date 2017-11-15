package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import io.circe.Json
import io.circe.syntax._
import models.DateFormat._
import models.{Flag, Stub}
import models.api._
import org.joda.time.DateTime

import scala.concurrent.ExecutionContext.Implicits.global

object PrototypeAPI {

  def createStub(body: Json): ApiResponseFt[ContentUpdate] =
    for {
      convertedJson <- flatStubJsonToStubJson(body)
      res <- ApiResponseFt.Async.Right(postRequest("stubs", convertedJson))
      json <- parseBody(res.body)
      createRes <- extractDataResponse[ContentUpdate](json)
    } yield createRes

  def putStub(stubId: Long, body: Json): ApiResponseFt[ContentUpdate] =
    for {
      convertedJson <- flatStubJsonToStubWithCollaboratorsJson(body)
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId", convertedJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[ContentUpdate](json)
    } yield putRes

  def getStub(id: Long): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs/$id"))
      json <- parseBody(res.body)
      item <- extractDataResponseOpt[Stub](json)
    } yield item

  def getStubByComposerId(composerId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content/$composerId"))
      json <- parseBody(res.body)
      item <- extractDataResponseOpt[Stub](json)
    } yield item

  def getStubByEditorId(editorId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"atom/$editorId"))
      json <- parseBody(res.body)
      item <- extractDataResponseOpt[Stub](json)
    } yield item

  def putStubDue(id: Long, date: Option[DateTime]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/dueDate", date.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubNote(id: Long, note: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/note", note.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubAssignee(id: Long, assignee: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assignee", assignee.asJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[Long](json)
    } yield putRes

  def putStubAssigneeEmail(id: Long, assigneeEmail: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assigneeEmail", assigneeEmail.asJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[Long](json)
    } yield putRes

  def putStubProdOffice(id: Long, status: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/prodOffice", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubTrashed(id: Long, trashed: Boolean): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/updateTrashed", trashed.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubLegalStatus(id: Long, status: Flag): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/needsLegal", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubPriority(id: Long, priority: Int): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/priority", priority.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubSection(id: Long, section: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/section", section.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubWorkingTitle(id: Long, wt: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/workingTitle", wt.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item


  def deleteContentByStubId(id: Long): ApiResponseFt[Option[String]] =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"stubs/$id"))
      json <- parseBody(res.body)
      deleteRes <- extractDataResponseOpt[String](json)
    } yield deleteRes

  def updateContentStatus(stubId: Long, status: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/status", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def updateContentStatusByComposerId(composerId: String, status: String): ApiResponseFt[String] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"content/$composerId/status", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[String](json)
    } yield item
}
