package controllers

import play.api.mvc._

object Feature extends Controller with PanDomainAuthActions {

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
