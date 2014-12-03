package controllers

import com.gu.workflow.db.{SectionDeskMappingDB, SectionDB, DeskDB}

import scala.concurrent.ExecutionContext.Implicits.global

import lib._
import lib.Composer._

import play.api.mvc._
import play.api.libs.json.Json

object Application extends Controller with PanDomainAuthActions {

  def index = app("Workflow")

  def app(title: String) = AuthAction.async { request =>

    for {
      statuses <- StatusDatabase.statuses
      sections = SectionDB.sectionList.sortBy(_.name)
      desks = DeskDB.deskList.sortBy(_.name)
      sectionsInDesks = SectionDeskMappingDB.getSectionsInDesks
    }
    yield {
      val user = request.user

      val config = Json.obj(
        "composer" -> Json.obj(
          "create" -> newContentUrl,
          "view" -> adminUrl,
          "details" -> contentDetails
        ),
        "statuses" -> statuses,
        "desks"    -> desks,
        "sections" -> sections,
        "sectionsInDesks" -> sectionsInDesks, // TODO: Combine desks & sectionsInDesks
        "presenceUrl" -> PrototypeConfiguration.cached.presenceUrl,
        "presenceClientLib" -> PrototypeConfiguration.cached.presenceClientLib,
        "user" -> Json.parse(user.toJson),
        "incopyExportUrl" -> PrototypeConfiguration.cached.incopyExportUrl
      )

      Ok(views.html.app(title, Some(user), config))
    }
  }

  def featureList(implicit request: Request[_]): Map[String, Boolean] = {
    def featureDef(name: String): (String, Boolean) =
      (name, request.cookies.get(name).map(_.value == "1").getOrElse(false))
    Map(featureDef("incopy-export"))
  }

  def makeCookie[A](name: String, value: Boolean => Boolean)
                (implicit request: Request[A]): Option[Cookie] =
    featureList.get(name).map { curVal =>
      Cookie(name, if(value(curVal)) "1" else "0", Some(Int.MaxValue),
             httpOnly = false)
    }

  def featureSwitch(name: String, value: Boolean => Boolean) =
    AuthAction { implicit request =>
      makeCookie(name, value).map(cookie =>
        TemporaryRedirect("/").withCookies(cookie))
        .getOrElse(BadRequest(s"Unknown cookie $name"))
    }

  def featureSwitchOn(name: String) =
    featureSwitch(name, _ => true)

  def featureSwitchOff(name: String) =
    featureSwitch(name, _ => false)

  def featureSwitchToggle(name: String) =
    featureSwitch(name, !_)
}
