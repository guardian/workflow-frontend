package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc.Controller
import play.api.libs.json.{Reads, Json, Writes}

import lib.Responses._
import lib._
import models.{Section, WorkflowContent, Stub}
import org.joda.time.DateTime


object Api extends Controller with Authenticated {

  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  def content = Authenticated.async { req =>

    for {
      sections <- SectionDatabase.sectionList
      statuses <- StatusDatabase.statuses

      content = PostgresDB.getContent(
        section = req.getQueryString("section").map(Section(_)),
        dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate),
        dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate),
        status = req.getQueryString("status").flatMap(StatusDatabase.find),
        contentType = req.getQueryString("content-type"),
        //todo - make this a boolean
        published = req.getQueryString("state").map(_ == "published")
      )
    }
    yield Ok(renderJsonResponse(content))
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

  def newStub = Authenticated { implicit request =>
    request.body.asJson.fold(
      BadRequest("could not read json")
    )(jsValue => {
        jsValue.validate[Stub].fold(
          jsErrors => BadRequest(s"failed to parse the json ${jsErrors}"),
          stub => {
            PostgresDB.createStub(stub)
            NoContent
          }
        )
      }
    )
  }

  def putStub(stubId: Long) = Authenticated { implicit request =>
    request.body.asJson.fold(
      BadRequest("could not read json")
    )(jsValue => {
        jsValue.validate[Stub].fold(
          jsErrors => BadRequest(s"failed to parse the json ${jsErrors}"),
          stub => {
            PostgresDB.updateStub(stubId, stub)
            NoContent
          }
        )
      }
    )
  }

  def putContent(composerId: String) = Authenticated { implicit request =>
     request.body.asJson.fold(
       BadRequest("could not read json from the request body")
     )(jsValue =>
        jsValue.validate[WorkflowContent].fold(
          jsErrors => BadRequest(s"failed to parse the json ${jsErrors}"),
          wc => {
            PostgresDB.updateContent(wc)
            NoContent
          }
        )
     )
  }


  def putContentStatus(composerId: String) = Authenticated { implicit request =>
    request.body.asJson.fold(
      BadRequest("could not read json from the request body")
    )(jsValue =>
      (jsValue \ "data").validate[String].fold(
        jsErrors => BadRequest(s"that failed ${jsErrors}"),
        status => {
          PostgresDB.updateContentStatus(status, composerId)
          NoContent
        }
      )
    )
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
        Redirect(routes.Application.stubs())
      }
    }
  }

}

case class User(id: String, email: String, firstName: String, lastName: String)

object User {

  implicit val userWrites: Writes[User] = Json.writes[User]
  implicit val userReads: Reads[User] = Json.reads[User]

  def find(u: String): Option[User] = Json.parse(u).validate[User].asOpt

}
