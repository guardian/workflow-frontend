package controllers

import play.api.mvc._

object Login extends Controller with PanDomainAuthActions{

  def oauthCallback = Action.async { implicit request =>
    processGoogleCallback()
  }
}