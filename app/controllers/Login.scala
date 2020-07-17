package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.Config
import play.api.libs.ws.WSClient
import play.api.mvc._
import play.api.{ Logging }
import play.filters.headers.SecurityHeadersFilter

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

class Login(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with Logging {

  def oauthCallback = Action.async { implicit request =>
    processOAuthCallback()
  }

  def status = AuthAction { request =>
    val user = request.user
    logger.info(s"User ${user.email} successfully restablished session via login/status")
    Ok(views.html.loginStatus(user.toJson)).withHeaders(SecurityHeadersFilter.X_FRAME_OPTIONS_HEADER -> "SAMEORIGIN")
  }

  def logout = Action.async { implicit request =>
    Future(processLogout)
  }
}
