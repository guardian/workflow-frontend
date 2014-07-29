package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import lib._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with AuthActions {

  def index = AuthAction.async { request =>
    val user = request.session.get("identity")

    for {
      statuses <- StatusDatabase.statuses
    }
    yield Ok(views.html.index(Json.obj("data" -> statuses), user))
  }

  def dashboard = AuthAction.async { req =>
    for {
      sections <- SectionDatabase.sectionList
      statuses <- StatusDatabase.statuses
    }
    yield {
       Ok(views.html.dashboard(sections, statuses))
    }
  }
}
