package controllers

import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with AuthActions {

  def index = AuthAction.async { request =>
    for {
      statuses <- StatusDatabase.statuses
    }
    yield Ok(views.html.index(Json.obj("data" -> statuses)))
  }

  def dashboard = AuthAction.async { req =>
    for {
      statuses <- StatusDatabase.statuses
    }
    yield {
      val sections = SectionDB.sectionList
      Ok(views.html.dashboard(sections, statuses))
    }
  }
}
