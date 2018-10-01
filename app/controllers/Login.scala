package controllers

import com.gu.pandomainauth.PublicSettings
import play.api.mvc._

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

object Login extends Controller with MaybeAuth {

  def oauthCallback = maybeAuth.async { implicit request =>
//    processGoogleCallback()
    Future(Ok("Done auth"))
  }

  def status = maybeAuth { request =>
    val user = request.user
    Ok(views.html.loginStatus(user.toJson))
  }

  def logout = Action.async { implicit request =>
//    clearPandaCookies()
    Future(Ok("Done unauth"))
  }
}