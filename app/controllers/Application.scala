package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.syntax.RequestSyntax._

import play.api.mvc._
import play.api.libs.json.Json
import play.api.libs.openid.OpenID


object Application extends Controller with Authenticated {

  def index = Authenticated.async {
    for {
      statuses <- StatusDatabase.statuses
    }
    yield Ok(views.html.index(Some(Json.obj("data" -> statuses))))
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
}
