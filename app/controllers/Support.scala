package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import config.Config
import play.api.Logging
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}

class Support(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher,
  override val permissions: PermissionsProvider,
) extends BaseController with PanDomainAuthActions with Logging {
  def sendLog: Action[AnyContent] = APIAuthAction { implicit request =>
    (for {
        js <- request.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
        val logMsg  = msg.copy(fields = msg.fields.map(fields => {
          fields + ("userEmail" -> request.user.email)
        }))
        ClientMessageLoggable.logClientMessage(logMsg)
    }).getOrElse {
      logger.info(s"unrecognised message ${request.body}")
    }
    NoContent
  }
}
