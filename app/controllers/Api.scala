package controllers

import models.Flag.Flag

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc.{AnyContent, SimpleResult, Controller}
import play.api.libs.json._

import lib.Responses._
import lib._
import models.{Section, WorkflowContent, Stub}
import org.joda.time.DateTime
import com.gu.workflow.db.CommonDB

object Api extends Controller with AuthActions {

  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  def content = AuthAction { implicit req =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val section = req.getQueryString("section").map(Section(_))
    val contentType = req.getQueryString("content-type")
    val flags = req.queryString.get("flags") getOrElse Nil

    val content = PostgresDB.getContent(
      section = req.getQueryString("section").map(Section(_)),
      dueFrom = dueFrom,
      dueUntil = dueUntil,
      status = req.getQueryString("status").flatMap(StatusDatabase.find),
      contentType = contentType,
      published = req.getQueryString("state").map(_ == "published"),
      flags = flags
    )

    val stubs = CommonDB.getStubs(
                  dueFrom = dueFrom,
                  dueUntil = dueUntil,
                  section = section,
                  contentType = contentType,
                  unlinkedOnly = true)

    Ok(Json.obj("content" -> content, "stubs" -> stubs))
  }

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  def stubs = AuthAction { implicit req =>
    stubFilters.bindFromRequest.fold(
      formWithErrors => BadRequest(formWithErrors.errorsAsJson),
      { case (dueFrom, dueUntil) => Ok(renderJsonResponse(CommonDB.getStubs(dueFrom, dueUntil))) }
    )
  }

  def newStub = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      stub <- extract[Stub](jsValue).right
    } yield {
      PostgresDB.createStub(stub)
      NoContent
    }).merge
  }

  def putStub(stubId: Long) = AuthAction { implicit request =>
    (for {
          jsValue <- readJsonFromRequest(request.body).right
          stub <- extract[Stub](jsValue).right
        } yield {
          PostgresDB.updateStub(stubId, stub)
          NoContent
     }).merge
  }

  def putStubAssignee(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      assignee <- extract[String](jsValue \ "data").right
    } yield {
        val assignOpt = Some(assignee).filter(_.nonEmpty)
        PostgresDB.updateStubWithAssignee(stubId, assignOpt)
        NoContent
    }).merge
  }

  def putStubDueDate(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
    } yield {
        val dueDate = (jsValue \ "data").asOpt[String] filter { _.length != 0 } map { new DateTime(_) }
        PostgresDB.updateStubDueDate(stubId, dueDate)
        NoContent
    }).merge
  }

  def putContentStatus(composerId: String) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[String](jsValue \ "data").right
    } yield {
      PostgresDB.updateContentStatus(status, composerId)
      NoContent
    }).merge
  }

  def putStubLegalStatus(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[Flag](jsValue \ "data").right
    } yield {
      PostgresDB.updateStubLegalStatus(stubId, status)
      NoContent
    }).merge
  }

  def deleteContent(composerId: String) = AuthAction {
    CommonDB.deleteContent(composerId)
    NoContent
  }

  def deleteStub(stubId: Long) = AuthAction {
    PostgresDB.deleteStub(stubId)
    NoContent
  }


  def linkStub(stubId: Long, composerId: String, contentType: String) = AuthAction { req =>

    if(PostgresDB.stubLinkedToComposer(stubId)) BadRequest(s"stub with id $stubId is linked to a composer item")

    else {
      PostgresDB.updateStubWithComposerId(stubId, composerId, contentType)
      NoContent
    }

  }

  def sections = AuthAction.async {
    for (sectionList <- SectionDatabase.sectionList)
      yield {
      Ok(Json.obj("data" -> sectionList))
    }
  }

  private def readJsonFromRequest(requestBody: AnyContent): Either[SimpleResult, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
  }

  private def extract[A: Reads](jsValue: JsValue): Either[SimpleResult, A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(a)
      case error @ JsError(_) => Left(BadRequest(s"failed to parse the json ${error}"))
    }
  }
}


