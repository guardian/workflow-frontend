package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.DeskDatabase
import models._
import play.api.data.Form
import play.api.libs.json.{Json, JsValue}


object Admin extends Controller {

  import play.api.data.Forms._


  def index = Action {
    Redirect(routes.Admin.desks)
  }

  val addDeskForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(Desk.apply)(Desk.unapply)
  )

  def desks = Action.async {
    for (desks <- DeskDatabase.deskList) yield Ok(views.html.desks(desks, addDeskForm))
  }

  def addDesk = Action.async { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("failed to add desk"))
      },
      desk => {
        DeskDatabase.upsert(desk).map{ _ =>
          Redirect(routes.Admin.desks)
        }
      }
    )
  }
}
