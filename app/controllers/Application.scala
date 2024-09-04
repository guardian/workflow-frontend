package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.{PermissionDefinition, PermissionsProvider}
import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI, StubAPI}
import com.gu.workflow.lib.{Priorities, StatusDatabase, TagService}
import config.Config
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import io.circe.{Decoder, Encoder, Json, parser}
import lib.{AtomWorkshopConfig, ComposerConfig, MediaAtomMakerConfig}
import models.api.ApiResponseFt
import models.{Desk, EditorialSupportStaff, Section}
import play.api.{Logger, Logging}
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

class Application(
  val editorialSupportTeams: EditorialSupportTeamsController,
  val sectionsAPI: SectionsAPI,
  val tagService: TagService,
  val desksAPI: DesksAPI,
  val sectionDeskMappingsAPI: SectionDeskMappingsAPI,
  override val permissions: PermissionsProvider,
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher,
  stubsApi: StubAPI,
) extends BaseController with PanDomainAuthActions with Logging {

  def getSortedSections(): Future[List[Section]] = {
    sectionsAPI.getSections.asFuture.map {
      case Left(err) => logger.error(s"error fetching sections: $err"); List()
      case Right(sections) => sections.sortBy(_.name)
    }
  }

  def getSortedDesks(): Future[List[Desk]] = {
    desksAPI.getDesks.asFuture.map {
      case Right(desks) => desks.sortBy(_.name)
      case Left(err) => logger.error(s"error fetching desks: $err"); List()
    }
  }

  def getSectionsInDesks(): Future[List[models.api.SectionsInDeskMapping]] = {
    sectionDeskMappingsAPI.getSectionsInDesks.asFuture.map {
      case Right(mappings) => mappings
      case Left(err) => logger.error(s"error fetching section desk mappings: $err"); List()
    }
  }

  def index = AuthAction { request =>
    Redirect(routes.Application.dashboard)
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

  def editorialSupport = AuthAction { implicit request =>
    val staff = editorialSupportTeams.listStaff()
    val teams = EditorialSupportStaff.groupByTeams(staff)

    val fronts = EditorialSupportStaff.getTeam("Fronts", teams)
    val other = teams.filterNot(_.name == "Fronts")

    Ok(views.html.editorialSupportStatus(other, fronts))
  }

  def updateEditorialSupport = AuthAction(parse.form(EditorialSupportStaff.form)) { implicit request =>
    editorialSupportTeams.updateStaff(request.body)
    // Get the browser to reload the page once we've sucessfully updated
    Redirect(routes.Application.editorialSupport)
  }

  // limited tag fields we want output into the DOM
  case class LimitedTag(id: Long, externalName: String)
  object LimitedTag {
    implicit val encoder: Encoder[LimitedTag] = deriveEncoder
    implicit val decoder: Decoder[LimitedTag] = deriveDecoder
  }

  private val pinboardPermission = PermissionDefinition("pinboard", "pinboard")

  def app(title: String) = AuthAction.async { request =>
    for {
      sections <-  getSortedSections()
      desks <- getSortedDesks()
      sectionsInDesks <- getSectionsInDesks()
      commissioningDesks <- tagService.getTags(
        Map(
          "limit" -> "200",
          "query" -> "tracking/commissioningdesk/",
          "type" -> "tracking",
          "searchField" -> "path"
        ).toList
      )
    }
    yield {
      val statuses = StatusDatabase.statuses
      val user = request.user

      val jsonConfig = Json.obj(

        ("composer", Json.obj(
          ("create", Json.fromString(ComposerConfig(config).newContentUrl)),
          ("view", Json.fromString(ComposerConfig(config).adminUrl)),
          ("details", Json.fromString(ComposerConfig(config).contentDetails)),
          ("templates", Json.fromString(ComposerConfig(config).templates))
        )),
        ("mediaAtomMaker", Json.obj(
          ("create", Json.fromString(MediaAtomMakerConfig(config).newContentUrl)),
          ("view", Json.fromString(MediaAtomMakerConfig(config).viewContentUrl))
        )),
        ("atomWorkshop", Json.obj(
          ("create", Json.fromString(AtomWorkshopConfig(config).newContentUrl)),
          ("view", Json.fromString(AtomWorkshopConfig(config).viewContentUrl))
        )),
        ("statuses", statuses.asJson),
        ("desks", desks.asJson),
        ("sections", sections.asJson),
        ("sectionsInDesks", sectionsInDesks.asJson), // TODO: Combine desks & sectionsInDesks
        ("priorities", Priorities.all.asJson),
        ("viewerUrl", Json.fromString(config.viewerUrl)),
        ("storyPackagesUrl", Json.fromString(config.storyPackagesUrl)),
        ("presenceUrl", Json.fromString(config.presenceUrl)),
        ("user", parser.parse(user.toJson).getOrElse(Json.Null)),
        ("incopyOpenUrl", Json.fromString(config.incopyOpenUrl)),
        ("incopyExportUrl", Json.fromString(config.incopyExportUrl)),
        ("indesignExportUrl", Json.fromString(config.indesignExportUrl)),
        ("composerRestorerUrl", Json.fromString(config.composerRestorerUrl)),
        ("commissioningDesks", commissioningDesks.map(t => LimitedTag(t.id, t.externalName)).asJson),
        ("atomTypes", config.atomTypes.asJson),
        ("sessionId", Json.fromString(config.sessionId)),
        ("gaId", Json.fromString(config.googleTrackingId)),
        ("tagManagerUrl",Json.fromString(config.tagManagerUrl))
      )

      val hasPinboardPermission = permissions.hasPermission(pinboardPermission, request.user.email)

      Ok(views.html.app(
        title,
        Some(user),
        config = jsonConfig,
        gaId = config.googleTrackingId,
        presenceClientLib = config.presenceClientLib,
        maybePinboardLoaderUrl = if(hasPinboardPermission) Some(config.pinboardLoaderUrl) else None
      ))
    }
  }

  def redirect(stubId: Long) = AuthAction.async { request =>
    stubsApi.getStub(stubId).map{
      case Some(stub) if stub.composerId.isDefined => Redirect(
        url = s"${config.composerUrl}/content/${stub.composerId.get}",
        queryStringParams = request.queryString // forward any query params
      )
      case _ => NotFound
    }.asFuture.map{
      case Left(err) => {
        logger.error(s"could not get stub with id $stubId, for redirect. Error: $err")
        InternalServerError
      }
      case Right(result) => result
    }
  }

}
