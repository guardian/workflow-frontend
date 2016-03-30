package controllers

import com.gu.workflow.api.CommonAPI
import com.gu.workflow.db.Schema._
import com.gu.workflow.db._
import com.gu.workflow.lib.StatusDatabase
import com.gu.workflow.query.WfQuery
import lib._
import Response._
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.mvc._
import play.api.data.Form
import lib._
import models.{Status => WorkflowStatus, _}
import scala.util.{Failure, Success}

object Admin extends Controller with PanDomainAuthActions {

  import play.api.data.Forms._

  def getSortedSections(): Future[List[Section]] = {
    CommonAPI.getSections().asFuture.map { x =>
      x match {
        case Left(err) => Logger.error(s"error fetching sections: $err"); List()
        case Right(sections) => sections.sortBy(_.name)
      }
    }
  }


  def index() = (AuthAction andThen WhiteListAuthFilter) {

    Redirect("/admin/desks-and-sections")
  }

  def desksAndSections(selectedDeskIdOption: Option[Long]) = (AuthAction andThen WhiteListAuthFilter).async {

    val deskList = DeskDB.deskList

    val selectedDeskOption = for {
      selectedDeskId <- selectedDeskIdOption
      selectedDesk <- deskList.find((desk) => selectedDeskId == desk.id)
    } yield {
      selectedDesk
    }

    val desks = selectedDeskOption.map { selectedDesk =>
      deskList.map { desk =>
        if (desk.id == selectedDesk.id)
          desk.copy(name = desk.name, selected = true)
        else
          desk
      }
    }.getOrElse(deskList)


    getSortedSections.map { sectionListFromDB =>
      val sectionList = selectedDeskOption.map { selectedDesk =>
        SectionDeskMappingDB.getSectionsWithRelation(selectedDesk, sectionListFromDB)
      }.getOrElse(sectionListFromDB)

      Ok(
        views.html.admin.desksAndSections(
          sectionList.sortBy(_.name),
          addSectionForm,
          desks.sortBy(_.name),
          addDeskForm,
          selectedDeskOption)
      )
    }
  }

  def newsLists = (AuthAction andThen WhiteListAuthFilter) {
    Ok(views.html.admin.newsLists(NewsListDB.newsListList.sortBy(newsList => newsList.title), addNewsListForm, SectionDB.sectionList))
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

  def assignSectionToDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    assignSectionToDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to update section assignments"),
      sectionAssignment => {
        SectionDeskMappingDB.assignSectionsToDesk(sectionAssignment.desk, sectionAssignment.sections.map(id => id.toLong))
        Redirect(routes.Admin.desksAndSections(Some(sectionAssignment.desk)))
      }
    )
  }

  /*
    SECTION routes
   */

  def addSection = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to add section"),
      section => {
        SectionDB.upsert(section)
        Redirect(routes.Admin.desksAndSections(None))
      }
    )
  }

  def removeSection = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove section"),
      section => {
        SectionDeskMappingDB.removeSectionMappings(section)
        SectionDB.remove(section)
        NoContent
      }
    )
  }

  /*
    DESK routes
   */

  def addDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to add desk ${formWithErrors.errors}"),
      desk => {
        DeskDB.upsert(desk)
        Redirect(routes.Admin.desksAndSections(None))
      }
    )
  }

  def removeDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove desk"),
      desk => {
        SectionDeskMappingDB.removeDeskMappings(desk)
        DeskDB.remove(desk)
        NoContent
      }
    )
  }

  /*
  NEWSLIST routes
 */

  val addNewsListForm = Form(
    mapping(
      "title" -> text,
      "id" -> longNumber,
      "default_section" -> optional(longNumber)
    )(NewsList.apply)(NewsList.unapply)
  )

  def addNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to add news list ${formWithErrors.errors}"),
      newsList => {
        NewsListDB.upsert(newsList)
        Redirect(routes.Admin.newsLists())
      }
    )
  }

  def updateNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to update news list ${formWithErrors.errors}"),
      newsList => {
        NewsListDB.update(newsList)
        Redirect(routes.Admin.newsLists())
      }
    )
  }

  def removeNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove news list"),
      newsList => {
        NewsListDB.remove(newsList)
        NoContent
      }
    )
  }

}
