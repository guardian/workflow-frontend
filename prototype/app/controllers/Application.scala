package controllers

import com.gu.googleauth.UserIdentity
import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json


object Application extends Controller with AuthActions {

  def index = all("Dashboard")

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
