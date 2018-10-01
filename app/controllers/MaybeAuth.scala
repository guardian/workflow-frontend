package controllers

import com.gu.pandomainauth.action.UserRequest
import com.gu.pandomainauth.model.User
import config.Config
import controllers.PanDomainAuthActions.{APIAuthAction, AuthAction}
import play.api.Logger
import play.api.mvc.{ActionBuilder, Request, Result}

import scala.concurrent.Future

trait MaybeAuth {
  object FakeAction extends ActionBuilder[UserRequest] {
    override def invokeBlock[A](request: Request[A], block: UserRequest[A] => Future[Result]): Future[Result] = {
      Logger.debug(s"Running in dev mode, no need for user to auth")
      val user = User("dev", "mode", "dev.user@theguardian.com", None)
      block(new UserRequest[A](user, request))
    }
  }

  val maybeAuth = if (Config.stage == "DEV") FakeAction else AuthAction
  val maybeAPIAuth = if (Config.stage == "DEV") FakeAction else APIAuthAction
}
