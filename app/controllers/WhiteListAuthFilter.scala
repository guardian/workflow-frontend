package controllers

import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.lib.Config
import io.circe.Json
import play.api.mvc._

import scala.concurrent.Future

object WhiteListAuthFilter extends ActionFilter[UserRequest] {

  override def filter[A](request:UserRequest[A]) = Future.successful {
    val user = request.user
    val whitelist = Config.getConfigStringList("application.admin.whitelist").right.getOrElse(List())

    if(whitelist.contains(user.email)) {
      None
    } else {
      Some(Results.Forbidden(views.html.admin.unauthorisedUser(Json.Null)))
    }
  }

}
