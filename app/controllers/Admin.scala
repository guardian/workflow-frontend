package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.SectionDatabase
import models._
import play.api.data.Form
import play.api.libs.json.{Json, JsValue}


object Admin extends Controller {

  import play.api.data.Forms._


  def index = Action {
    Redirect(routes.Admin.sections)
  }

  val addSectionForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(Section.apply)(Section.unapply)
  )

  def sections = Action.async {
    for (sections <- SectionDatabase.sectionList) yield Ok(views.html.sections(sections, addSectionForm))
  }

  def addSection = Action.async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("failed to add section"))
      },
      section => {
        SectionDatabase.upsert(section).map{ _ =>
          Redirect(routes.Admin.sections)
        }
      }
    )
  }

  def removeSection = Action.async { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("failed to remove section"))
      },
      section => {
        SectionDatabase.remove(section).map{ _ =>
          NoContent
        }
      }
    )
  }
}
