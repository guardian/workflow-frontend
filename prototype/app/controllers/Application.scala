package controllers

import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with PanDomainAuthActions {

  def index = app("Dashboard")

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList
    }
    yield {
      val user = request.user

      val config = Json.obj(
        "composer" -> Json.obj(
          "create" -> newContentUrl,
          "view" -> adminUrl,
          "details" -> contentDetails
        ),
        "statuses" -> statuses,
        "sections" -> sections,
        "presenceUrl" -> PrototypeConfiguration.cached.presenceUrl,
        "user" -> Json.parse(user.toJson)
      )

      Ok(views.html.app(title, Some(user), config))
    }
  }
}
