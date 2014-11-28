package controllers

import com.gu.workflow.db.{SectionDeskMappingDB, SectionDB, DeskDB}

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
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> PrototypeConfiguration.cached.incopyExportUrl
      )

      Ok(views.html.app(title, Some(user), config))
    }
  }
}
