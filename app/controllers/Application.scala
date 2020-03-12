 package controllers

import cats.syntax.either._
import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI}
import com.gu.workflow.lib.{Priorities, StatusDatabase, TagService}
import config.Config
import config.Config.defaultExecutionContext
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import io.circe.{Decoder, Encoder, Json, parser}
import lib.{AtomWorkshopConfig, Composer, MediaAtomMakerConfig}
import models.{Desk, EditorialSupportStaff, Section}
import play.api.Logger
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
    val staff = EditorialSupportTeamsController.listStaff()
    val teams = EditorialSupportStaff.groupByTeams(staff)

    val fronts = EditorialSupportStaff.getTeam("Fronts", teams)
    val other = teams.filterNot(_.name == "Fronts")

    Ok(views.html.editorialSupportStatus(other, fronts))
  }

  def updateEditorialSupport = AuthAction(parse.form(EditorialSupportStaff.form)) { implicit request =>
    EditorialSupportTeamsController.updateStaff(request.body)
    // Get the browser to reload the page once we've sucessfully updated
    Redirect(routes.Application.editorialSupport())
  }

  // limited tag fields we want output into the DOM
  case class LimitedTag(id: Long, externalName: String)
  object LimitedTag {
    implicit val encoder: Encoder[LimitedTag] = deriveEncoder
    implicit val decoder: Decoder[LimitedTag] = deriveDecoder
  }

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections <-  getSortedSections()
      desks <- getSortedDesks()
      sectionsInDesks <- getSectionsInDesks()
      commissioningDesks <- TagService.getTags(Config.tagManagerUrl+
        "/hyper/tags?limit=200&query=tracking/commissioningdesk/&type=tracking&searchField=path")
    }
    yield {
      val user = request.user

      val config = Json.obj(

        ("composer", Json.obj(
          ("create", Json.fromString(Composer.newContentUrl)),
          ("view", Json.fromString(Composer.adminUrl)),
          ("details", Json.fromString(Composer.contentDetails))
        )),
        ("mediaAtomMaker", Json.obj(
          ("create", Json.fromString(MediaAtomMakerConfig.newContentUrl)),
          ("view", Json.fromString(MediaAtomMakerConfig.viewContentUrl))
        )),
        ("atomWorkshop", Json.obj(
          ("create", Json.fromString(AtomWorkshopConfig.newContentUrl)),
          ("view", Json.fromString(AtomWorkshopConfig.viewContentUrl))
        )),
        ("statuses", statuses.asJson),
        ("desks", desks.asJson),
        ("sections", sections.asJson),
        ("sectionsInDesks", sectionsInDesks.asJson), // TODO: Combine desks & sectionsInDesks
        ("priorities", Priorities.all.asJson),
        ("viewerUrl", Json.fromString(Config.viewerUrl)),
        ("storyPackagesUrl", Json.fromString(Config.storyPackagesUrl)),
        ("presenceUrl", Json.fromString(Config.presenceUrl)),
        ("preferencesUrl", Json.fromString(Config.preferencesUrl)),
        ("user", parser.parse(user.toJson).getOrElse(Json.Null)),
        ("incopyOpenUrl", Json.fromString(Config.incopyOpenUrl)),
        ("incopyExportUrl", Json.fromString(Config.incopyExportUrl)),
        ("indesignOpenUrl", Json.fromString(Config.indesignOpenUrl)),
        ("indesignExportUrl", Json.fromString(Config.indesignExportUrl)),
        ("composerRestorerUrl", Json.fromString(Config.composerRestorerUrl)),
        ("commissioningDesks", commissioningDesks.map(t => LimitedTag(t.id, t.externalName)).asJson),
        ("atomTypes", Config.atomTypes.asJson),
        ("sessionId", Json.fromString(Config.sessionId)),
        ("gaId", Json.fromString(Config.googleTrackingId)),
        ("webPush", Json.obj(
          ("publicKey", Json.fromString(Config.webPushPublicKey))
        ))
      )

      Ok(views.html.app(title, Some(user), config, Config.googleTrackingId, Config.presenceClientLib))
    }
  }
}
