package controllers

import play.api.mvc._
import lib.AWSWorkflowQueue

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def consumeFeed = Action {
    val messages = AWSWorkflowQueue.getMessages(5)

    val workflowItems = messages.map(AWSWorkflowQueue.toWorkflowContent(_))

    Ok(workflowItems.toList.toString)
  }

}