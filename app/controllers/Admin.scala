package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI}
import config.Config
import io.circe.{Json, parser}
import lib.AdminPermissionFilter
import models.api.ApiError
import models._
import models.api.ApiError
import play.api.Logging
import play.api.data.Form
import play.api.i18n.I18nSupport
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class Admin(
  sectionsAPI: SectionsAPI,
  desksAPI: DesksAPI,
  sectionDeskMappingsAPI: SectionDeskMappingsAPI,
  permissions: PermissionsProvider,
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with I18nSupport with Logging {

  private val PermissionFilter = new AdminPermissionFilter(config, permissions)

  import play.api.data.Forms._

  def getSortedSections(): Future[List[Section]] = {
    sectionsAPI.getSections.asFuture.map {
      case Left(err) => logger.error(s"error fetching sections: $err"); List()
      case Right(sections) => sections.sortBy(_.name)
    }
  }

  def getDesks(): Future[List[Desk]] = {
    desksAPI.getDesks.asFuture.map {
      case Right(desks) => desks
      case Left(err) => logger.error(s"error fetching desks: $err"); List()
    }
  }

  def getSectionMappings(
    selectedDeskIdOption: Option[Long],
    sectionListFromDB: List[Section],
    deskList: List[Desk]):
      Future[List[Section]] = {
    val selectedDeskOption = for {
      selectedDeskId <- selectedDeskIdOption
      selectedDesk <- deskList.find((desk) => selectedDeskId == desk.id)
    } yield {
      selectedDesk
    }

    selectedDeskOption.map { selectedDesk =>
      sectionDeskMappingsAPI
        .getSectionsWithRelation(selectedDesk, sectionListFromDB)
        .asFuture
        .map {
          case Right(relations) => relations
          case Left(err) => logger.error(s"unable to fetch the sections in the relation: $err")
            List()
        }
    }.getOrElse(Future(sectionListFromDB))
  }

  def index() = (AuthAction andThen PermissionFilter) {
    Redirect("/admin/desks-and-sections")
  }

  def desksAndSections(selectedDeskIdOption: Option[Long]) = (AuthAction andThen PermissionFilter).async { implicit request =>
    for {
      deskList <- getDesks()
      sectionListFromDB <- getSortedSections()
      sectionList <- getSectionMappings(selectedDeskIdOption, sectionListFromDB, deskList)
    } yield {

      val selectedDeskOption = for {
        selectedDeskId <- selectedDeskIdOption
        selectedDesk <- deskList.find((desk) => selectedDeskId == desk.id)
      } yield selectedDesk

      val desks = selectedDeskOption.map { selectedDesk =>
        deskList.map { desk =>
          if (desk.id == selectedDesk.id)
            desk.copy(name = desk.name, selected = true)
          else
            desk
        }
      }.getOrElse(deskList)

      Ok(
        views.html.admin.desksAndSections(
          Json.Null,
          sectionList.sortBy(_.name),
          addSectionForm,
          desks.sortBy(_.name),
          addDeskForm,
          selectedDeskOption)
      )
    }
  }

  val addSectionForm = Form(
    mapping(
      "name" -> nonEmptyText,
      "selected" -> boolean,
      "id" -> longNumber
    )(Section.apply)(Section.unapply)
  )

  val addDeskForm = Form(
    mapping(
      "name" -> nonEmptyText,
      "selected" -> boolean,
      "id" -> longNumber
    )(Desk.apply)(Desk.unapply)
  )

  case class assignSectionToDeskFormData(desk: Long, sections: List[String])

  val assignSectionToDeskForm = Form(
    mapping(
      "desk" -> longNumber,
      "sections" -> list(text)
    )(assignSectionToDeskFormData.apply)(assignSectionToDeskFormData.unapply)
  )

  def assignSectionToDesk = (AuthAction andThen PermissionFilter).async { implicit request =>
    assignSectionToDeskForm.bindFromRequest().fold(
      formWithErrors => Future(BadRequest("failed to update section assignments")),
      sectionAssignment => {
        sectionDeskMappingsAPI.assignSectionsToDesk(sectionAssignment.desk, sectionAssignment.sections.map(id => id.toLong))
          .asFuture
          .map {
            case Right(_) => Redirect(routes.Admin.desksAndSections(Some(sectionAssignment.desk)))
            case Left(err) =>
              logger.error(s"error upserting section desk mapping: $err")
              InternalServerError
          }
      }
    )
  }

  /*
   SECTION routes
   */

  def addSection = (AuthAction andThen PermissionFilter).async { implicit request =>
    addSectionForm.bindFromRequest().fold(
      formWithErrors => Future(BadRequest("failed to add section")),
      section => {
        sectionsAPI.upsertSection(section).asFuture.map {
          case Right(_) => Redirect(routes.Admin.desksAndSections(None))
          case Left(err) =>
            logger.error(s"error upserting section: $err")
            InternalServerError
        }
      }
    )
  }

  def removeSection = (AuthAction andThen PermissionFilter).async { implicit request =>
    addSectionForm.bindFromRequest().fold(
      formWithErrors => Future(BadRequest("failed to remove section")),
      section => {
        for {
        _ <- sectionDeskMappingsAPI.removeSectionMapping(section.id).asFuture
        _ <- sectionsAPI.removeSection(section).asFuture
        } yield NoContent
      }
    )
  }

  /*
   DESK routes
   */

  def addDesk = (AuthAction andThen PermissionFilter).async { implicit request =>
    addDeskForm.bindFromRequest().fold(
      formWithErrors => Future(BadRequest(s"failed to add desk ${formWithErrors.errors}")),
      desk => {
        desksAPI.upsertDesk(desk).asFuture.map {
          case Right(_) => Redirect(routes.Admin.desksAndSections(None))
          case Left(err) =>
            logger.error(s"error creating desk: $err")
            InternalServerError
        }
      }
    )
  }

  def removeDesk = (AuthAction andThen PermissionFilter).async { implicit request =>
    addDeskForm.bindFromRequest().fold(
      formWithErrors => Future(BadRequest("failed to remove desk")),
      desk => {
        for {
          _ <- sectionDeskMappingsAPI.removeDeskMapping(desk.id).asFuture
          _ <- desksAPI.removeDesk(desk).asFuture
        } yield {
          NoContent
        }
      }
    )
  }

  /*
    Section Tag association
   */

  val addSectionTagForm = Form(
    mapping(
      "section_id" -> longNumber,
      "tag_id" -> nonEmptyText
    )(assignTagToSectionFormData.apply)(assignTagToSectionFormData.unapply)
  )

  val removeSectionTagForm = Form(
    mapping(
      "section_id" -> longNumber,
      "tag_id" -> nonEmptyText
    )(unAssignTagToSectionFormData.apply)(unAssignTagToSectionFormData.unapply)
  )

  def sectionsAndTags(selectedSectionIdOption: Option[Long]) = (AuthAction andThen PermissionFilter).async {

    val selectedSectionOptionFt:Future[Option[Section]] = selectedSectionIdOption match {
      case Some(selectedSectionId) =>
        for {
          sections <- getSortedSections()
        } yield Some(sections.filter( x => x.id == selectedSectionId ).head)
      case None => Future(None)
    }
    val tagIdsFuture: Future[List[String]] = selectedSectionIdOption match {
      case Some(selectedSectionId) =>
        val tagIdsFt: Future[Either[ApiError, List[String]]] = sectionsAPI.getTagsForSectionFt(selectedSectionId).asFuture
        tagIdsFt.map(_.right.get)
      case None => Future.successful(List())
    }
    for {
      deskList <- getDesks()
      sectionListFromDB <- getSortedSections()
      tagIds <- tagIdsFuture
      selectedSectionOption <- selectedSectionOptionFt
    } yield {
      val capiKeyJson: Json = parser.parse(s"""{"CAPI_API_KEY": ${config.capiKey}}""").right.get
      Ok(
        views.html.admin.sectionsAndTags(
          capiKeyJson,
          sectionListFromDB,
          selectedSectionIdOption,
          selectedSectionOption,
          tagIds,
          addSectionTagForm
        )
      )
    }
  }

  def addSectionTag() = (AuthAction andThen PermissionFilter) { implicit request =>
    addSectionTagForm.bindFromRequest().fold(
      formWithErrors => {
        BadRequest("failed to execute controllers.admin.addSectionTag()")
      },
      data => {
        sectionsAPI.insertSectionTag(data.sectionId,data.tagId)
        NoContent
      }
    )
  }

  def removeSectionTag() = (AuthAction andThen PermissionFilter) { implicit request =>
    removeSectionTagForm.bindFromRequest().fold(
      formWithErrors => {
        BadRequest("failed to execute controllers.admin.removeSectionTag()")
      },
      data => {
        sectionsAPI.removeSectionTag(data.sectionId,data.tagId)
        NoContent
      }
    )
  }

}
