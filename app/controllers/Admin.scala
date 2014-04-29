package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.ContentDatabase
import models._
import play.api.data.Form
import java.util.UUID
import play.api.libs.json.{Json, JsValue}
import play.api.Routes


object Admin extends Controller {

  import play.api.data.Forms._


  def index = Action {
    Redirect(routes.Admin.desks)
  }

  def desks = Action {
    Ok(views.html.desks("go away!"))
  }
}
