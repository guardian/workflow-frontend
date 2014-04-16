package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.mvc._
import lib.Database
import models._
import scala.Some
import play.mvc.Http.Response
import scala.concurrent.Future

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def content = Action.async {
    Database.store.future.map(items => Ok(views.html.contentDashboard(items)))
  }


  def success(item: WorkflowContent, workflowState: WorkflowStatus): SimpleResult = {
    val newItem = item.copy(status=workflowState)
    Database.store.alter(items => items.updated(newItem.path, newItem))
    Ok("posted this")
  }

  def stateChange(status: String, contentId: String) = Action.async {
    WorkflowStatus.findWorkFlowStatus(status).map { workFlowStatus =>
      for {
        altered <- Database.store.alter { items =>
          val updatedItem = items.get(contentId).map(_.copy(status = workFlowStatus))
          updatedItem.map(items.updated(contentId, _)).getOrElse(items)
        }
      }
      yield {
        if (altered.contains(contentId)) Ok("Updated the state.")
        else NotFound("Could not find that content.")
      }
    }.getOrElse(Future.successful(BadRequest(s"invalid status $status")))
  }

}
