package controllers

import com.gu.workflow.db.{SectionDeskMappingDB, SectionDB, DeskDB}
import com.gu.workflow.lib.StatusDatabase

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json

object Application extends Controller with PanDomainAuthActions {

  def index = AuthAction { request =>
    Redirect(routes.Application.dashboard)
  }

  def plan = AuthAction { request =>
    Ok(views.html.plan())
  }

  def dashboard = app("Workflow")

  def about = AuthAction { request =>
      Ok(views.html.about())
  }

  def faqs = AuthAction { request =>
    Ok(views.html.faqs())
  }

  def troubleshooting = Action { request =>
    Ok(views.html.troubleshooting())
  }

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList.sortBy(_.name)
      desks = DeskDB.deskList.sortBy(_.name)
      sectionsInDesks = SectionDeskMappingDB.getSectionsInDesks
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
        "desks"    -> desks,
        "sections" -> sections,
        "sectionsInDesks" -> sectionsInDesks, // TODO: Combine desks & sectionsInDesks
        "presenceUrl" -> PrototypeConfiguration.cached.presenceUrl,
        "presenceClientLib" -> PrototypeConfiguration.cached.presenceClientLib,
        "preferencesUrl" -> PrototypeConfiguration.cached.preferencesUrl,
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> PrototypeConfiguration.cached.incopyExportUrl
      )

      Ok(views.html.app(title, Some(user), config))
    }
  }
}
