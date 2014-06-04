package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import java.util.UUID

import lib._
import lib.syntax.RequestSyntax._
import models._

import play.api.mvc._
import play.api.libs.json.Json
import play.api.libs.openid.OpenID


object Application extends Controller with Authenticated {

  def index = Authenticated {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def stubs = Action.async {
    val stubs = PostgresDB.getStubs()
    for (sections <- SectionDatabase.sectionList)
    yield Ok(views.html.stubs(stubs, sections))
  }

  def login = Action {
    Ok(views.html.login())
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

  def dashboard = Authenticated.async { req =>
    for {
      sections <- SectionDatabase.sectionList
      statuses <- StatusDatabase.statuses
    }
    yield {
       Ok(views.html.dashboard(sections, statuses))
    }
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
