package controllers

import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with AuthActions {

  def index = app("Dashboard")

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList
    }
    yield {
      val user = request.identity
      val userJson = user.map(u => Json.toJson(u)).getOrElse(Json.obj())

      val config = Json.obj(
        "composer" -> Json.obj(
          "create" -> newContentUrl,
          "view" -> adminUrl,
          "details" -> contentDetails
        ),
        "statuses" -> statuses,
        "sections" -> sections,
        "user" -> userJson
      )

      Ok(views.html.app(title, user, config))
    }
  }
}
