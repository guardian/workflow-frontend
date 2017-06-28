package controllers

import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI}
import com.gu.workflow.lib.{StatusDatabase, TagService}
import config.Config
import config.Config.defaultExecutionContext
import lib.{Atom, Composer}
import models.{Desk, Section}
import play.api.Logger
import play.api.libs.json.{Format, Json}
import play.api.mvc._

import scala.concurrent.Future

object Application extends Controller with PanDomainAuthActions {

  def getSortedSections(): Future[List[Section]] = {
    SectionsAPI.getSections.asFuture.map {
      case Left(err) => Logger.error(s"error fetching sections: $err"); List()
      case Right(sections) => sections.sortBy(_.name)
    }
  }

  def getSortedDesks(): Future[List[Desk]] = {
    DesksAPI.getDesks.asFuture.map {
      case Right(desks) => desks.sortBy(_.name)
      case Left(err) => Logger.error(s"error fetching desks: $err"); List()
    }
  }

  def getSectionsInDesks(): Future[List[models.api.SectionsInDeskMapping]] = {
    SectionDeskMappingsAPI.getSectionsInDesks.asFuture.map { x =>
      println(s"sections in desks: $x")
      x match {
        case Right(mappings) => mappings
        case Left(err) => Logger.error(s"error fetching section desk mappings: $err"); List()
      }
    }
  }

  def index = AuthAction { request =>
    Redirect(routes.Application.dashboard())
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

  def editorialSupport = AuthAction { request =>
    val teams = EditorialSupportTeamsController.getTeams()
    def filterTeam(name: String) = teams.filter(x => x.name == name).head
    Ok(views.html.editorialSupportStatus(filterTeam("Audience"), filterTeam("Fronts")))
  }

  // limited tag fields we want output into the DOM
  case class LimitedTag(id: Long, externalName: String)
  object LimitedTag { implicit val jsonFormats: Format[LimitedTag] = Json.format[LimitedTag]}

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections <-  getSortedSections()
      desks <- getSortedDesks()
      sectionsInDesks <- getSectionsInDesks()
      commissioningDesks <- TagService.getTags(Config.tagManagerUrl+
        "/hyper/tags?limit=100&query=tracking/commissioningdesk/&type=tracking&searchField=path")
    }
    yield {
      val user = request.user

      val config = Json.obj(
        "composer" -> Json.obj(
          "create" -> Composer.newContentUrl,
          "view" -> Composer.adminUrl,
          "details" -> Composer.contentDetails
        ),
        "mediaAtomMaker" -> Json.obj(
          "create" -> Atom.newContentUrl,
          "view" -> Atom.viewContentUrl
        ),
        "statuses" -> statuses,
        "desks"    -> desks,
        "sections" -> sections,
        "sectionsInDesks" -> sectionsInDesks, // TODO: Combine desks & sectionsInDesks
        "viewerUrl" -> Config.viewerUrl,
        "presenceUrl" -> Config.presenceUrl,
        "preferencesUrl" -> Config.preferencesUrl,
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> Config.incopyExportUrl,
        "composerRestorerUrl" -> Config.composerRestorerUrl,
        "commissioningDesks" -> commissioningDesks.map(t => LimitedTag(t.id, t.externalName))
      )

      Ok(views.html.app(title, Some(user), config, Config.presenceClientLib))
    }
  }
}
