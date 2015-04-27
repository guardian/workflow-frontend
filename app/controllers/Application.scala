package controllers

import com.gu.workflow.db.{NewsListDB, NewsListBucketDB, SectionDeskMappingDB, SectionDB, DeskDB}
import com.gu.workflow.lib.StatusDatabase

import lib.PrototypeConfiguration.defaultExecutionContext

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.{JsObject, Json}

object Application extends Controller with PanDomainAuthActions {

  def index = AuthAction { request =>
    Redirect(routes.Application.dashboard)
  }

  def plan = AuthAction.async { request =>
    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList.sortBy(_.name)
      desks = DeskDB.deskList.sortBy(_.name)
      sectionsInDesks = SectionDeskMappingDB.getSectionsInDesks
      newsLists = NewsListDB.newsListList.sortBy(_.title)
      newsListBuckets = NewsListBucketDB.newsListBucketsList.groupBy(_.newsList).map({
        case (newsList, buckets) => (newsList, Json.toJson(buckets))
      }).toSeq
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
        "incopyExportUrl" -> PrototypeConfiguration.cached.incopyExportUrl,
        "newsLists" -> newsLists,
        "newsListBuckets" -> JsObject(newsListBuckets)
      )

      Ok(views.html.app("Plan View", Some(user), config))
    }
  }

  def dashboard = app("Workflow")

  def training = AuthAction { request =>
      Ok(views.html.training())
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
