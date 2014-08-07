package controllers

import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with PanDomainAuthActions {

  def index = AuthAction.async { request =>
    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList
    }
    //put these in one object
    yield {
      Ok(views.html.index(Json.obj("data" -> statuses), Json.obj("data" -> sections)))
    }
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
