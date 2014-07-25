package controllers

import com.gu.workflow.db.SectionDB

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import play.api.data.Form

import lib._
import models.{Status => WorkflowStatus, Section}


object Admin extends Controller with AuthActions {

  import play.api.data.Forms._

  def index = AuthAction {
    Redirect(routes.Admin.sections)
  }

  val addSectionForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(Section.apply)(Section.unapply)
  )

  def sections = AuthAction {
    val sections = SectionDB.sectionList
    Ok(views.html.sections(sections, addSectionForm))
  }

  def addSection = AuthAction { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to add section"),
      section => {
         SectionDB.upsert(section)
         Redirect(routes.Admin.sections)
      }
    )
  }

  def removeSection = AuthAction { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove section"),
      section => {
        SectionDB.remove(section)
        NoContent
      }
    )
  }

  val statusForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(WorkflowStatus.apply)(WorkflowStatus.unapply)
  )

  def status = AuthAction.async {
    for (statuses <- StatusDatabase.statuses) yield Ok(views.html.status(statuses, statusForm))
  }

  def addStatus = processStatusUpdate("failed to add status") { status =>
    StatusDatabase.add(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def removeStatus = processStatusUpdate("failed to remove status") { status =>
    StatusDatabase.remove(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def moveStatusUp = processStatusUpdate("failed to move status") { status =>
    StatusDatabase.moveUp(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def moveStatusDown = processStatusUpdate("failed to move status") { status =>
    StatusDatabase.moveDown(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def processStatusUpdate(error: String)(block: WorkflowStatus => Future[SimpleResult]) = Action.async { implicit request =>
    statusForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest(error))
      },
      block
    )
  }
}
