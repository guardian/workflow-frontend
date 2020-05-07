package lib

import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions._
import config.Config
import io.circe.Json
import play.api.mvc.{ActionFilter, Result, Results}

import scala.concurrent.Future

object AdminPermissionFilter extends ActionFilter[UserRequest] {
  private val app = "workflow"
  private val adminPermission: PermissionDefinition = PermissionDefinition("workflow_admin", app)

  private val permissions: PermissionsProvider = {
    val permissionsStage = if(Config.isProd) { "PROD" } else { "CODE" }
    PermissionsProvider(PermissionsConfig(permissionsStage, Aws.region, Aws.credentialsProvider))
  }

  override def filter[A](request:UserRequest[A]): Future[Option[Result]] = Future.successful {
    if (permissions.hasPermission(adminPermission, request.user.email)) {
      None
    } else {
      Some(Results.Forbidden(views.html.admin.unauthorisedUser(Json.Null)))
    }
  }
}
