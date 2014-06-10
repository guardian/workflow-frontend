package controllers

import scala.concurrent.ExecutionContext.Implicits.global

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

  def content = Authenticated { implicit req =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val content = PostgresDB.getContent(
      section = req.getQueryString("section").map(Section(_)),
      dueFrom = dueFrom,
      dueUntil = dueUntil,
      status = req.getQueryString("status").flatMap(StatusDatabase.find),
      contentType = req.getQueryString("content-type"),
      published = req.getQueryString("state").flatMap(ContentState.fromString).map(_ == ContentState.Published)
    )

    val stubs = PostgresDB.getStubs(dueFrom = dueFrom, dueUntil = dueUntil, unlinkedOnly = true)
    Ok(Json.obj("content" -> content, "stubs" -> stubs))
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

  def putContent(composerId: String) = Authenticated { implicit request =>
    request.body.asJson.map { wc =>
      wc.validate[WorkflowContent].fold(
        jsErrors => {
          BadRequest(s"that failed ${jsErrors}")
        },
        content => {
          PostgresDB.updateContent(content)
          NoContent
        }
      )
    }.getOrElse(BadRequest("could not read json from the request"))
  }

  def deleteStub(stubId: Long) = Authenticated {
    PostgresDB.deleteStub(stubId)
    NoContent
  }

  def linkStub(stubId: Long, composerId: String) = Authenticated { req =>

    import play.api.Play.current
    import play.api.db.slick.DB

    DB.withTransaction { implicit session =>
      if(PostgresDB.stubLinkedToComposer(stubId)) {
        BadRequest(s"stub with id $stubId is linked to a composer item")
      }
      else {
        PostgresDB.updateStubWithComposerId(stubId, composerId)
        NoContent
      }
    }
  }

  def sections = Authenticated.async {
    for (sectionList <- SectionDatabase.sectionList)
      yield {
      Ok(Json.obj("data" -> sectionList))
    }
  }

}

case class User(id: String, email: String, firstName: String, lastName: String)

object User {

  implicit val userWrites: Writes[User] = Json.writes[User]
  implicit val userReads: Reads[User] = Json.reads[User]

  def find(u: String): Option[User] = Json.parse(u).validate[User].asOpt

}
