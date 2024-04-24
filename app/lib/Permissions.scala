package lib

import com.gu.permissions.PermissionDefinition

object Permissions {
  val app = "workflow"

  val adminPermission: PermissionDefinition = PermissionDefinition("workflow_admin", app)
  val accessPermission: PermissionDefinition = PermissionDefinition("workflow_access", app)

}
