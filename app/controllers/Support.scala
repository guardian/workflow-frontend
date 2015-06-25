package controllers

import play.api.Logger
import play.api.mvc.{Action, Controller}


object Support extends Controller {

  def logger = Action { req =>
    Logger.info("******* DO I GET HIT*****")
    println(req.body.asJson)
    NoContent
  }


}
