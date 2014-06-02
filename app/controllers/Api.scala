package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc.Controller
import play.api.libs.json.{Reads, Json, Writes}

import lib.Responses._
import lib._
import models.{Section, ContentState, WorkflowContent, Stub}
import org.joda.time.DateTime


object Api extends Controller with Authenticated {

  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  def content = Authenticated.async { req =>

    for {
      sections <- SectionDatabase.sectionList
      statuses <- StatusDatabase.statuses

      items = PostgresDB.getContent(
        section = req.getQueryString("section").map(Section(_)),
        dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate),
        dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate),
        status = req.getQueryString("status").flatMap(StatusDatabase.find),
        contentType = req.getQueryString("content-type"),
        published = req.getQueryString("state").flatMap(ContentState.fromString).map(_ == ContentState.Published)
      )

      content = items.sortBy(_.due)
    }
    yield {
      Ok(renderJsonResponse(content))
    }
  }

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  def stubs = Authenticated { implicit req =>
    stubFilters.bindFromRequest.fold(
      formWithErrors => BadRequest(formWithErrors.errorsAsJson),
      { case (dueFrom, dueUntil) => Ok(renderJsonResponse(PostgresDB.getStubs(dueFrom, dueUntil))) }
    )
  }

  val stubForm: Form[Stub] = Form(
    mapping(
      "id"      -> optional(longNumber),
      "title"   -> nonEmptyText,
      "section" -> text,
      "due"     -> optional(iso8601DateTime),
      "assignee" -> optional(text),
      "composerId" -> optional(text)
    )((id, title, section, due, assignee, composerId) =>
      Stub(id, title, section, due, assignee, composerId)
      )(s => Some((s.id, s.title, s.section, s.due, s.assignee, s.composerId))))

  def newStub = Authenticated { implicit request =>
    stubForm.bindFromRequest.fold(
      formWithErrors =>  {
        BadRequest(s"that failed ${formWithErrors}")
      },
      stub => {
        PostgresDB.createStub(stub)
        Redirect(routes.Application.stubs())
      }
    )
  }

  def putStub(stubId: Long) = Authenticated { implicit request =>
    stubForm.bindFromRequest.fold(
      formWithErrors =>  {
        BadRequest(s"that failed ${formWithErrors}")
      },
      stub => {
        PostgresDB.updateStub(stubId, stub)
        NoContent
      }
    )
  }

  def deleteStub(stubId: Long) = Authenticated {
    PostgresDB.deleteStub(stubId)
    NoContent
  }

  def linkStub(stubId: Long, composerId: String) = Authenticated { req =>
    Try { stubId.toLong }.toOption.map { id =>
      PostgresDB.updateStubWithComposerId(id, composerId)
      Redirect(routes.Application.stubs())
    }.getOrElse(BadRequest("could not parse stub id"))
  }

}

case class User(id: String, email: String, firstName: String, lastName: String)

object User {

  implicit val userWrites: Writes[User] = Json.writes[User]
  implicit val userReads: Reads[User] = Json.reads[User]

  def find(u: String): Option[User] = Json.parse(u).validate[User].asOpt

}
