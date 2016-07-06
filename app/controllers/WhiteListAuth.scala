package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.mvc._
import com.gu.workflow.lib.Config
import com.gu.pandomainauth.action.UserRequest
import play.api.libs.json.Json

object WhiteListAuthFilter extends ActionFilter[UserRequest] {

  override def filter[A](request:UserRequest[A]) = Future.successful {
    val user = request.user
    val whitelist = Config.getConfigStringList("application.admin.whitelist").right.getOrElse(List())

    if(whitelist.contains(user.email)) {
      None
    } else {
      Some(Results.Forbidden(views.html.admin.unauthorisedUser(Json.obj())))
    }
  }

}
