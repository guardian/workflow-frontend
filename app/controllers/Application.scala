package controllers

import com.gu.workflow.db._
import com.gu.workflow.lib.{TagService, StatusDatabase}

import config.Config
import config.Config.defaultExecutionContext
import models.Tag

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
      bundleList = BundleDB.getBundles
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
        "presenceUrl" -> Config.presenceUrl,
        "presenceClientLib" -> Config.presenceClientLib,
        "preferencesUrl" -> Config.preferencesUrl,
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> Config.incopyExportUrl,
        "newsLists" -> newsLists,
        "newsListBuckets" -> JsObject(newsListBuckets),
        "bundleList" -> bundleList
      )

      Ok(views.html.app("Newslister", Some(user), config))
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

  // limited tag fields we want output into the DOM
  case class LimitedTag(id: Long, externalName: String)
  object LimitedTag { implicit val jsonFormats = Json.format[LimitedTag]}

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList.sortBy(_.name)
      desks = DeskDB.deskList.sortBy(_.name)
      sectionsInDesks = SectionDeskMappingDB.getSectionsInDesks
      commissioningDesks <- TagService.getTags(Config.tagManagerUrl+ "/hyper/tags?limit=100&query=tracking/commissioningdesk/&type=tracking&searchField=path").map(_.getOrElse(List[Tag]()))
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
        "viewerUrl" -> Config.viewerUrl,
        "presenceUrl" -> Config.presenceUrl,
        "presenceClientLib" -> Config.presenceClientLib,
        "preferencesUrl" -> Config.preferencesUrl,
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> Config.incopyExportUrl,
        "composerRestorerUrl" -> Config.composerRestorerUrl,
        "commissioningDesks" -> commissioningDesks.map(t => LimitedTag(t.id, t.externalName))
      )

      Ok(views.html.app(title, Some(user), config))
    }
  }
}
