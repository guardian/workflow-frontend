package lib

import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import com.gu.workflow.util.AWS
import config.Config
import io.circe.Json
import lib.Permissions.adminPermission
import play.api.Logging
import play.api.mvc.{ActionFilter, Result, Results}

import scala.concurrent.{ExecutionContext, Future}

class AdminPermissionFilter(
                             config: Config,
                             permissions: PermissionsProvider
                           )(implicit ec: ExecutionContext) extends ActionFilter[UserRequest] with Logging {
  override protected def executionContext: ExecutionContext = ec


  override def filter[A](request:UserRequest[A]): Future[Option[Result]] = Future.successful {
    val email = request.user.email

    if (permissions.hasPermission(adminPermission, email)) {
      logger.info(s"User $email has ${adminPermission.name} permissions")
      None
    } else {
      logger.warn(s"User $email does not have ${adminPermission.name} permissions")
      Some(Results.Forbidden(views.html.admin.unauthorisedUser(Json.Null)))
    }
  }
}
