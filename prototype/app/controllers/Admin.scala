package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import play.api.data.Form

import lib._
import models.{Status => WorkflowStatus, Section}


object Admin extends Controller {

  import play.api.data.Forms._

  def index = Action {
    Redirect(routes.Admin.sections)
  }

  val addSectionForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(Section.apply)(Section.unapply)
  )

  def sections = Action.async {
    for (sections <- SectionDatabase.sectionList) yield Ok(views.html.sections(sections, addSectionForm))
  }

  def addSection = Action.async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("failed to add section"))
      },
      section => {
        SectionDatabase.upsert(section).map{ _ =>
          Redirect(routes.Admin.sections)
        }
      }
    )
  }

  def removeSection = Action.async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("failed to remove section"))
      },
      section => {
        SectionDatabase.remove(section).map{ _ =>
          NoContent
        }
      }
    )
  }

  val statusForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(WorkflowStatus.apply)(WorkflowStatus.unapply)
  )

  def status = Action.async {
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
