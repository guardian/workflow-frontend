package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc.{Action, Controller}
import play.api.mvc.Security.AuthenticatedBuilder
import play.api.libs.json.{Reads, Json, Writes}

import lib.Responses._
import lib.{Formatting, StatusDatabase, SectionDatabase, PostgresDB}
import models.{ContentState, WorkflowContent, Stub}
import org.joda.time.DateTime


object Api extends Controller {

  object Authenticated extends AuthenticatedBuilder(req => req.session.get("user").flatMap(u => User.find(u)),
    req => Redirect(routes.Application.login()))


  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  def filterPredicate(filterKey: String, value: String)(wc: WorkflowContent): Boolean = {
    // Use of `forall` ensures content with no due date set is always shown
    def filterDue(cmp: (DateTime, DateTime) => Boolean): Boolean =
      wc.due.forall(due => Formatting.parseDate(value).forall(v => cmp(due, v)))

    filterKey match {
      case "section"   => wc.section.exists(_.name == value)
      case "status"    => StatusDatabase.find(value) == Some(wc.status)
      case "due.from"  => filterDue((due, v) => due.isEqual(v) || due.isAfter(v))
      case "due.until" => filterDue((due, v) => due.isBefore(v))
      case "state"     => ContentState.fromString(value).exists(_ == wc.state)
      case "content-type" => wc.`type` == value
      case _ => true
    }
  }

  def content = Authenticated.async { req =>
    for {
      sections <- SectionDatabase.sectionList
      statuses <- StatusDatabase.statuses
      stubs = PostgresDB.getAllStubs
      items = PostgresDB.allContent

      predicate = (wc: WorkflowContent) => req.queryString.forall { case (k, vs) =>
        vs.exists(v => filterPredicate(k, v)(wc))
      }
      content = items.filter(predicate).sortBy(_.due)
    }
    yield {
      Ok(renderJsonResponse(content))
    }
  }


  val stubForm: Form[Stub] = Form(
    mapping(
      "id"      -> optional(longNumber),
      "title"   -> nonEmptyText,
      "section" -> text,
      "due"     -> optional(jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSS'Z")),
      "assignee" -> optional(text),
      "composerId" -> optional(text)
    )((id, title, section, due, assignee, composerId) =>
      Stub(id, title, section, due, assignee, composerId)
      )(s => Some((s.id, s.title, s.section, s.due, s.assignee, s.composerId))))

  def stubs = Authenticated {
    val stubs = PostgresDB.getAllStubs
    Ok(renderJsonResponse(stubs))
  }

  def newStub = Action { implicit request =>
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

  def putStub(stubId: Int) = Action { implicit request =>
    stubForm.bindFromRequest.fold(
      formWithErrors =>  {
        BadRequest(s"that failed ${formWithErrors}")
      },
      stub => {
        PostgresDB.updateStub(stubId, stub)
        Accepted("")
      }
    )
  }

  def updateStub(stubId: String, composerId: String) = Action { req =>
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
