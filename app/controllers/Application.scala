package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.util.Try
import java.util.UUID
import org.joda.time.DateTime

import lib._
import lib.RequestSyntax._
import models._

import play.api.mvc._
import play.api.data.Form
import play.api.libs.json.{Reads, Writes, Json, JsValue}
import play.api.libs.openid.OpenID
import play.api.mvc.Security.AuthenticatedBuilder
import play.api.http.MimeTypes


object Application extends Controller {

  import play.api.data.Forms._

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

  object Authenticated extends AuthenticatedBuilder(req => req.session.get("user").flatMap(u => User.find(u)),
                                                    req => Redirect(routes.Application.login()))

  def index = Authenticated {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def stubs = Action.async {
    val stubs = PostgresDB.getAllStubs
    for (sections <- SectionDatabase.sectionList)
    yield Ok(views.html.stubs(stubs, sections))
  }

  def stubsJson = Action {
    val stubs = PostgresDB.getAllStubs
    Ok(renderJsonResponse(stubs))
  }
  def login = Action {
    Ok(views.html.login())
  }

  case class User(id: String, email: String, firstName: String, lastName: String)

  object User {
    implicit val userWrites: Writes[User] = Json.writes[User]
    implicit val userReads: Reads[User] = Json.reads[User]

    def find(u: String): Option[User] = Json.parse(u).validate[User].asOpt

  }

  def loginPost = Action.async { implicit req =>
    val openIdAttributes = Seq(
      ("email", "http://axschema.org/contact/email"),
      ("firstname", "http://axschema.org/namePerson/first"),
      ("lastname", "http://axschema.org/namePerson/last")
    )
    val googleOpenIdUrl = "https://www.google.com/accounts/o8/id"
    val redirectTo = routes.Application.openIdRedirect.absoluteURL(secure = req.isSecure)
    OpenID.redirectURL(googleOpenIdUrl, redirectTo, openIdAttributes)
    .map(Redirect(_))
  }

  def openIdRedirect = Action.async { implicit req =>
    OpenID.verifiedId.map { userInfo =>
      val attr = userInfo.attributes
      val user = for { email <- attr.get("email")
                      if email.endsWith("@guardian.co.uk") || email.endsWith("@theguardian.com")
                      firstName <- attr.get("firstname")
                      lastName <- attr.get("lastname")
                     } yield User(userInfo.id, email, firstName, lastName)

      user.map {
        u => Redirect(routes.Application.index).withSession("user" -> Json.toJson(u).toString)
      }.getOrElse(Redirect(routes.Application.login()))
    }
  }

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

  def dashboard = Authenticated.async { req =>
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
       Ok(views.html.contentDashboard(content, sections, statuses))
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

  def renderJsonResponse[A : Writes](content: List[A]): JsValue = Json.obj("data" -> content)

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

  def fieldChange(field: String, value: String, contentId: String, user: Option[String]) = Action.async {

    val updateFunction: Either[SimpleResult, WorkflowContent => WorkflowContent] = field match {

      case "section" => Right(_.copy(section = Some(Section(value))))

      case "workingTitle" => Right(_.copy(workingTitle = value))

      case "status" => for { u<-user.toRight(BadRequest("user name not supplied")).right
                             s <- StatusDatabase.find(value).toRight(BadRequest(s"not a valid status $value")).right
                           } yield (wc: WorkflowContent) => wc.copy(status=s, stateHistory = wc.stateHistory.updated(s,u))


      case "launch" => Formatting.parseDate(value)
                       .map(d => (wc: WorkflowContent) => wc.copy(scheduledLaunch = Some(d)))
                       .toRight(BadRequest(s"not a valid date $value"))

      case f => Left(BadRequest(s"field '$f' doesn't exist"))
    }
    val id: Either[SimpleResult, UUID] = try { Right(UUID.fromString(contentId)) } catch {
      case e: IllegalArgumentException => Left(BadRequest(s"invalid UUID $contentId"))
    }
    (for {
      contentId <- id.right
      fun       <- updateFunction.right
    }
    yield alterContent(contentId, field, fun)).left.map(Future.successful).merge
  }

  def alterContent(contentId: UUID, field: String, fun: WorkflowContent => WorkflowContent): Future[SimpleResult] =
    ??? // TODO

}
