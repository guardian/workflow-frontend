package controllers

import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import com.gu.permissions.{PermissionDefinition, PermissionsProvider}
import config.Config
import lib.Permissions.{accessPermission, adminPermission}
import play.api.{Logger, Logging}
import play.api.mvc._

trait PanDomainAuthActions extends AuthActions with Results with Logging {
  def config: Config
  def permissions: PermissionsProvider

  // nb. if you need to change cacheValidation to true, this will have an impact on
  // the ability of the app to respond to changes in Workflow access permissions.
  override def cacheValidation: Boolean = false

  private def hasAtLeastAccessPermission(email: String) = {
    permissions.hasPermission(adminPermission, email) ||
      permissions.hasPermission(accessPermission, email)
  }


  override def validateUser(authedUser: AuthenticatedUser): Boolean = {
    val isValid = (authedUser.user.emailDomain == "guardian.co.uk") &&
      (authedUser.multiFactor || (config.no2faUser.length > 0 && config.no2faUser == authedUser.user.email))

    if (!isValid) {
      logger.warn(s"User ${authedUser.user.email} failed validation")
    } else if (hasAtLeastAccessPermission(authedUser.user.email)) {
      logger.info(s"User ${authedUser.user.email} access permission check passed")
    } else {
      logger.warn(s"User ${authedUser.user.email} access permission check denied")
    }

    isValid
  }

  override def authCallbackUrl: String = config.host + "/oauthCallback"

  override def showUnauthedMessage(message: String)(implicit request: RequestHeader): Result = {
    logger.info(message)
    Ok(views.html.login(Some(message)))
  }

  override def invalidUserMessage(claimedAuth: AuthenticatedUser): String = {
    if( (claimedAuth.user.emailDomain == "guardian.co.uk") && !claimedAuth.multiFactor) {
      s"${claimedAuth.user.email} is not valid for use with Workflow as you need to have two factor authentication enabled." +
       s" Please contact the Helpdesk by emailing 34444@theguardian.com or calling 34444 and request access to Composer CMS tools"
    } else {
      s"${claimedAuth.user.email} is not valid for use with Workflow. You need to use your Guardian Google account to login. Please sign in with your Guardian Google account first, then retry logging in"
    }
  }
}
