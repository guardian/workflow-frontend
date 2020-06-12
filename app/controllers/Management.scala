package controllers

import play.api.mvc._

class Management(
  override val controllerComponents: ControllerComponents
) extends BaseController {
  def healthCheck: Action[AnyContent] = Action {
    Ok(views.html.healthcheck())
  }
}
