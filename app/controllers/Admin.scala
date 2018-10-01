package controllers

import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI}
import com.gu.workflow.lib.{Config => LocalConfig}
import io.circe.{Json, parser}
import models.api.ApiError
import models.{Status => WorkflowStatus, _}
import play.api.Logger
import play.api.Play.current
import play.api.data.Form
import play.api.i18n.Messages.Implicits._
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object Admin extends Controller with MaybeAuth {

  import play.api.data.Forms._

  def getSortedSections(): Future[List[Section]] = {
    SectionsAPI.getSections.asFuture.map {
      case Left(err) => Logger.error(s"error fetching sections: $err"); List()
      case Right(sections) => sections.sortBy(_.name)
    }
  }

  def getDesks(): Future[List[Desk]] = {
    DesksAPI.getDesks.asFuture.map {
      case Right(desks) => desks
      case Left(err) => Logger.error(s"error fetching desks: $err"); List()
    }
  }

  def getSectionMappings(
    selectedDeskIdOption: Option[Long],
    sectionListFromDB: List[Section],
    deskList: List[Desk]):
      Future[List[Section]] = {
    val selectedDeskOption = for {
      selectedDeskId <- selectedDeskIdOption
      selectedDesk <- deskList.find(desk => selectedDeskId == desk.id)
    } yield {
      selectedDesk
    }

    selectedDeskOption.map { selectedDesk =>
      SectionDeskMappingsAPI
        .getSectionsWithRelation(selectedDesk, sectionListFromDB)
        .asFuture
        .map {
          case Right(relations) => relations
          case Left(err) => Logger.error(s"unable to fetch the sections in the relation: $err")
            List()
        }
    }.getOrElse(Future(sectionListFromDB))
  }

  def index() = (maybeAuth andThen WhiteListAuthFilter) {
    Redirect("/admin/desks-and-sections")
  }

  def desksAndSections(selectedDeskIdOption: Option[Long]) = (maybeAuth andThen WhiteListAuthFilter).async {
    for {
      deskList <- getDesks()
      sectionListFromDB <- getSortedSections()
      sectionList <- getSectionMappings(selectedDeskIdOption, sectionListFromDB, deskList)
    } yield {

      val selectedDeskOption = for {
        selectedDeskId <- selectedDeskIdOption
        selectedDesk <- deskList.find(desk => selectedDeskId == desk.id)
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

  def assignSectionToDesk = (maybeAuth andThen WhiteListAuthFilter).async { implicit request =>
    assignSectionToDeskForm.bindFromRequest.fold(
      formWithErrors => Future(BadRequest("failed to update section assignments")),
      sectionAssignment => {
        SectionDeskMappingsAPI.assignSectionsToDesk(sectionAssignment.desk, sectionAssignment.sections.map(id => id.toLong))
          .asFuture
          .map {
            case Right(_) => Redirect(routes.Admin.desksAndSections(Some(sectionAssignment.desk)))
            case Left(err) =>
              Logger.error(s"error upserting section desk mapping: $err")
              InternalServerError
          }
      }
    )
  }

  /*
   SECTION routes
   */

  def addSection = (maybeAuth andThen WhiteListAuthFilter).async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => Future(BadRequest("failed to add section")),
      section => {
        SectionsAPI.upsertSection(section).asFuture.map {
          case Right(_) => Redirect(routes.Admin.desksAndSections(None))
          case Left(err) =>
            Logger.error(s"error upserting section: $err")
            InternalServerError
        }
      }
    )
  }

  def removeSection = (maybeAuth andThen WhiteListAuthFilter).async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => Future(BadRequest("failed to remove section")),
      section => {
        for {
        _ <- SectionDeskMappingsAPI.removeSectionMapping(section.id).asFuture
        _ <- SectionsAPI.removeSection(section).asFuture
        } yield NoContent
      }
    )
  }

  /*
   DESK routes
   */

  def addDesk = (maybeAuth andThen WhiteListAuthFilter).async { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => Future(BadRequest(s"failed to add desk ${formWithErrors.errors}")),
      desk => {
        DesksAPI.upsertDesk(desk).asFuture.map {
          case Right(_) => Redirect(routes.Admin.desksAndSections(None))
          case Left(err) =>
            Logger.error(s"error creating desk: $err")
            InternalServerError
        }
      }
    )
  }

  def removeDesk = (maybeAuth andThen WhiteListAuthFilter).async { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => Future(BadRequest("failed to remove desk")),
      desk => {
        for {
          _ <- SectionDeskMappingsAPI.removeDeskMapping(desk.id).asFuture
          _ <- DesksAPI.removeDesk(desk).asFuture
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

  def sectionsAndTags(selectedSectionIdOption: Option[Long]) = maybeAuth.async {

    val selectedSectionOptionFt:Future[Option[Section]] = selectedSectionIdOption match {
      case Some(selectedSectionId) =>
        for {
          sections <- getSortedSections()
        } yield Some(sections.filter( x => x.id == selectedSectionId ).head)
      case None => Future(None)
    }
    val tagIdsFuture: Future[List[String]] = selectedSectionIdOption match {
      case Some(selectedSectionId) =>
        val tagIdsFt: Future[Either[ApiError, List[String]]] = SectionsAPI.getTagsForSectionFt(selectedSectionId).asFuture
        tagIdsFt.map(_.right.get)
      case None => Future.successful(List())
    }
    for {
      deskList <- getDesks()
      sectionListFromDB <- getSortedSections()
      tagIds <- tagIdsFuture
      selectedSectionOption <- selectedSectionOptionFt
    } yield {
      val config: Json = parser.parse(s"""{"CAPI_API_KEY": ${LocalConfig.getConfigString("capi.key").right.get}}""").right.get
      Ok(
        views.html.admin.sectionsAndTags(
          config,
          sectionListFromDB,
          selectedSectionIdOption,
          selectedSectionOption,
          tagIds,
          addSectionTagForm
        )
      )
    }
  }

  def addSectionTag() = maybeAuth { implicit request =>
    addSectionTagForm.bindFromRequest.fold(
      formWithErrors => {
        BadRequest("failed to execute controllers.admin.addSectionTag()")
      },
      data => {
        SectionsAPI.insertSectionTag(data.sectionId,data.tagId)
        NoContent
      }
    )
  }

  def removeSectionTag() = maybeAuth { implicit request =>
    removeSectionTagForm.bindFromRequest.fold(
      formWithErrors => {
        BadRequest("failed to execute controllers.admin.removeSectionTag()")
      },
      data => {
        SectionsAPI.removeSectionTag(data.sectionId,data.tagId)
        NoContent
      }
    )
  }

}
