package controllers

import play.api.mvc._
import scala.concurrent.Future

object Login extends Controller with PanDomainAuthActions {

  def oauthCallback = Action.async { implicit request =>
    processGoogleCallback()
  }

  def status = AuthAction { request =>
    val user = request.user
    Ok(views.html.loginStatus(user.toJson))
  }

  def logout = Action.async { implicit request =>
    Future(processLogout)
  }
}