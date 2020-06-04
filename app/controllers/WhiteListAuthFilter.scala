package controllers

import com.gu.pandomainauth.action.UserRequest
import config.Config
import io.circe.Json
import play.api.mvc._

import scala.concurrent.{ExecutionContext, Future}

class WhiteListAuthFilter(config: Config)(implicit ec: ExecutionContext) extends ActionFilter[UserRequest] {
  override protected def executionContext: ExecutionContext = ec

  override def filter[A](request:UserRequest[A]): Future[Option[Result]] = Future.successful {
    val user = request.user

    if(config.adminWhitelist.contains(user.email)) {
      None
    } else {
      Some(Results.Forbidden(views.html.admin.unauthorisedUser(Json.Null)))
    }
  }
}
