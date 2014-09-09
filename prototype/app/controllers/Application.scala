package controllers

import com.gu.googleauth.UserIdentity
import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with AuthActions {

  def index = AuthAction.async { request =>
    val user = request.session.get("identity")

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList
    }
    //put these in one object
    yield {
      Ok(views.html.index(Json.obj("data" -> statuses), Json.obj("data" -> sections), user))
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

  def all(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList
    }
    yield {
      val config = Json.obj(
        "composer" -> Json.obj(
          "create" -> newContentUrl,
          "view" -> adminUrl,
          "details" -> contentDetails
        ),
        "statuses" -> statuses,
        "sections" -> sections,
        "user" -> request.identity.get
      )

      Ok(views.html.layout(title, config))
    }
  }
}
