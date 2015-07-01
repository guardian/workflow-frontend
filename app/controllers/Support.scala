package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import play.api.Logger
import play.api.libs.json.Json
import play.api.mvc.{Action, Controller}


object Support extends Controller {

  def logger = Action { req =>
    (for {
        js <- req.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
      ClientMessageLoggable.logClientMessage(msg)
    }).getOrElse {
      Logger.info(s"unregonised message ${req.body}")
    }
    NoContent
  }


}
