package controllers

import play.api._
import play.api.mvc._

object Management extends Controller {

  def healthcheck = Action {
    Ok("healthcheck ok")
  }

}
