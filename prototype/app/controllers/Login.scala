package controllers

import play.api.mvc._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.json.Json
import scala.concurrent.Future
import com.gu.googleauth._
import play.api.Play.current

trait AuthActions extends Actions {
  val loginTarget: Call = routes.Login.login()
}

object Login extends Controller with AuthActions {
  import play.api.Play.current
  val config = play.api.Play.configuration

  val host = config.getString("host").getOrElse("http://localhost:9000")
  val clientId = config.getString("google.clientId").getOrElse(sys.error("could not find google client id"))
  val clientSecret = config.getString("google.clientSecret").getOrElse(sys.error("could not find google client secret"))

  val ANTI_FORGERY_KEY = "antiForgeryToken"
  val googleAuthConfig =
    GoogleAuthConfig(
      clientId,  // The client ID from the dev console
      clientSecret,                  // The client secret from the dev console
      host + "/oauth2callback",      // The redirect URL Google send users back to (must be the same as
      //    that configured in the developer console)
      Some("guardian.co.uk")                       // Google App domain to restrict login
    )

  // this is the only place we use LoginAuthAction - to prevent authentication redirect loops
  def login = LoginAuthAction { request =>
    val error = request.flash.get("error")
    Ok(views.html.login(error))
  }

  /*
  Redirect to Google with anti forgery token (that we keep in session storage - note that flashing is NOT secure)
   */
  def loginAction = Action.async { implicit request =>
    val antiForgeryToken = GoogleAuth.generateAntiForgeryToken()
    GoogleAuth.redirectToGoogle(googleAuthConfig, antiForgeryToken).map {
      _.withSession { request.session + (ANTI_FORGERY_KEY -> antiForgeryToken) }
    }
  }


  /*
  User comes back from Google.
  We must ensure we have the anti forgery token from the loginAction call and pass this into a verification call which
  will return a Future[UserIdentity] if the authentication is successful. If unsuccessful then the Future will fail.

   */
  def oauth2Callback = Action.async { implicit request =>
    val session = request.session
    session.get(ANTI_FORGERY_KEY) match {
      case None =>
        Future.successful(Redirect(routes.Login.login()).flashing("error" -> "Anti forgery token missing in session"))
      case Some(token) =>
        GoogleAuth.validatedUserIdentity(googleAuthConfig, token).map { identity =>
        // We store the URL a user was trying to get to in the LOGIN_ORIGIN_KEY in AuthAction
        // Redirect a user back there now if it exists
          val redirect = session.get(LOGIN_ORIGIN_KEY) match {
            case Some(url) => Redirect(url)
            case None => Redirect(routes.Application.index())
          }
          // Store the JSON representation of the identity in the session - this is checked by AuthAction later
          redirect.withSession {
            session + (UserIdentity.KEY -> Json.toJson(identity).toString) - ANTI_FORGERY_KEY - LOGIN_ORIGIN_KEY
          }
        } recover {
          case t =>
            // you might want to record login failures here - we just redirect to the login page
            Redirect(routes.Login.login())
              .withSession(session - ANTI_FORGERY_KEY)
              .flashing("error" -> s"Login failure: ${t.toString}")
        }
    }
  }

  def logout = Action { implicit request =>
    Redirect(routes.Application.index()).withNewSession
  }

}