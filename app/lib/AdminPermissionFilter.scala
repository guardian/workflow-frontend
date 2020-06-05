package lib

import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import com.gu.workflow.util.AWS
import config.Config
import io.circe.Json
import play.api.Logging
import play.api.mvc.{ActionFilter, Result, Results}

import scala.concurrent.{ExecutionContext, Future}

class AdminPermissionFilter(config: Config)(implicit ec: ExecutionContext) extends ActionFilter[UserRequest] with Logging {
  override protected def executionContext: ExecutionContext = ec

  private val adminPermission: PermissionDefinition = PermissionDefinition("workflow_admin", "workflow")

  private val permissions: PermissionsProvider = {
    val permissionsStage = if(config.isProd) { "PROD" } else { "CODE" }
    PermissionsProvider(PermissionsConfig(permissionsStage, AWS.region.getName, AWS.credentialsProvider))
  }

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
