package lib

import play.api.mvc.Controller
import play.api.mvc.Security.AuthenticatedBuilder
import controllers.{routes, User}


trait Authenticated { this: Controller =>

  object Authenticated extends AuthenticatedBuilder(req => req.session.get("user").flatMap(u => User.find(u)),
    req => Redirect(routes.Login.login()))

}
