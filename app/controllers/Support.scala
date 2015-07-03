package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import org.apache.commons.codec.binary.Base64
import play.api.Logger
import play.api.libs.json.Json
import play.api.mvc.{Action, Controller}

object Support extends Controller {

  def encodeEmail(msg: ClientLog) :ClientLog = {
    val newFields = msg.fields match {
      case Some(fields) => Some(fields map {
        case ("userEmail", email) => ("userEmail", Base64.encodeBase64(email.getBytes()).toString())
        case (key, value) => (key, value) // TODO: find out if this is the best way to do this
      })
      case None => None
    }
    ClientLog(msg.message, msg.level, msg.timestamp, newFields)
  }

  def logger = Action { req =>
    (for {
        js <- req.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
      ClientMessageLoggable.logClientMessage(encodeEmail(msg))
    }).getOrElse {
      Logger.info(s"unrecognised message ${req.body}")
    }
    NoContent
  }


}
