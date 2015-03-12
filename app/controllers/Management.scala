package controllers

import play.api.mvc.{Action, Controller}


object Management extends Controller {

  def healthCheck = Action {
    Ok(<h1>ok</h1>).as(HTML)
  }

}
