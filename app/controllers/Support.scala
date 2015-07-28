package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import play.api.Logger
import play.api.libs.json.Json
import play.api.mvc.{Action, Controller}
import play.api.libs.Crypto

object Support extends Controller {

  def encodeEmail(email: String) = {
    Crypto.encryptAES(email)
  }

  def adjust[A, B](m: Map[A, B], k: A)(f: B => B): Map[A,B] = {
      m.get(k).map(v => m.updated(k, f(v))).getOrElse(m)
  }


  def logger = Action { req =>
    (for {
        js <- req.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
      val logMsg  = msg.copy(fields = msg.fields.map(f => adjust(f, "userEmail")(encodeEmail)))
      ClientMessageLoggable.logClientMessage(logMsg)
    }).getOrElse {
      Logger.info(s"unrecognised message ${req.body}")
    }
    NoContent
  }


}
