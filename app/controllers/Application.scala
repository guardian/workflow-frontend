package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.Database
import models._
import play.api.data.Form
import java.util.UUID


object Application extends Controller {

  import play.api.data.Forms._

  val workFlowForm = Form(
  mapping(
    "title" -> text,
    "desk" -> text,
    "status" -> text
  )((title, desk, status)=>
        WorkflowContent(UUID.randomUUID(),
        path=None,
        workingTitle=Some(title),
        contributors=Nil,
        desk=Some(EditorDesk(desk)),
        status=WorkflowStatus.findWorkFlowStatus(status).getOrElse(WorkflowStatus.Created),
        lastModification=None
     ))((w: WorkflowContent) => Some(w.workingTitle.getOrElse("tmp"),"tmp", "tmp"))
  )

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def content = Action.async {
    Database.store.future.map(items => Ok(views.html.contentDashboard(items, workFlowForm)))
  }

  def newWorkFlow = Action.async { implicit request =>

    workFlowForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("that failed"))
      },
      contentItem => {
        Database.store.alter(items => items.updated(contentItem.id.toString, contentItem)).map { _ =>
          Redirect(routes.Application.content)
        }
      }
    )
  }


  def stateChange(status: String, contentId: String) = Action.async {
    WorkflowStatus.findWorkFlowStatus(status).map { workFlowStatus =>
      for {
        altered <- Database.update(contentId, wf => wf.copy(status=workFlowStatus))
      }
      yield {
        altered.map( _ => Ok("Updated the state")).getOrElse(NotFound("Could not find that content.") )
      }
    }.getOrElse(Future.successful(BadRequest(s"invalid status $status")))
  }


  def assignDesk(desk: String, contentId: String) = Action.async {
    for {
      altered <- Database.update(contentId, wf => wf.copy(desk=Some(EditorDesk(desk))))
    }
    yield {
      altered.map( _ => Ok("Updated the state")).getOrElse(NotFound("Could not find that content.") )
    }
  }

  def putWorkingTitle(path: String, workingTitle: String) = Action.async {
    for {
      altered <- Database.update(path, _.copy(workingTitle = Some(workingTitle)))
    }
    yield altered.map(_ => Accepted("New working title accepted.")).getOrElse(NotFound("Could not find that content."))
  }

}
