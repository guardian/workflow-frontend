package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.mvc._
import lib.Database

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def consumeFeed = Action.async {
    Database.store.future.map(items => Ok(views.html.contentDashboard(items)))
  }

}
