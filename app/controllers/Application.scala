package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.Database
import models._


object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def content = Action.async {
    Database.store.future.map(items => Ok(views.html.contentDashboard(items)))
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
}
