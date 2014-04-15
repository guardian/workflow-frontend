package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import play.api.libs.json._
import models.WorkflowContent
import lib.{Database, AWSWorkflowQueue}

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def consumeFeed = Action.async {
    Database.store.future.map(items => Ok(items.toString))
  }

}
