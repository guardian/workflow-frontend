package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import play.api.Logger
import play.api.mvc.{Action, AnyContent, Controller}

object Support extends Controller with PanDomainAuthActions {
  def logger: Action[AnyContent] = APIAuthAction { implicit request =>
    (for {
        js <- request.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
        val logMsg  = msg.copy(fields = msg.fields.map(fields => {
          fields + ("userEmail" -> request.user.email)
        }))
        ClientMessageLoggable.logClientMessage(logMsg)
    }).getOrElse {
      Logger.info(s"unrecognised message ${request.body}")
    }
    NoContent
  }
}
