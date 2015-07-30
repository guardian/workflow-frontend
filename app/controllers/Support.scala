package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import play.api.Logger
import play.api.libs.json.Json
import play.api.mvc.Controller
import play.api.libs.Crypto

object Support extends Controller with PanDomainAuthActions {

  def encryptWithApplicationSecret(s: String) = {
    // encryptAES uses the first 16 characters of application.secret to encrypt the string
    Crypto.encryptAES(s)
  }

  def adjust[A, B](m: Map[A, B], k: A)(f: B => B): Map[A,B] = {
      m.get(k).map(v => m.updated(k, f(v))).getOrElse(m)
  }


  def logger = APIAuthAction { implicit request =>

    (for {
        js <- request.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
        val logMsg  = msg.copy(fields = msg.fields.map(fields => {
          val fieldsWithEmail = fields + ("userEmail" -> request.user.email)
          adjust(fieldsWithEmail, "userEmail")(encryptWithApplicationSecret)
        }))
        ClientMessageLoggable.logClientMessage(logMsg)
    }).getOrElse {
      Logger.info(s"unrecognised message ${request.body}")
    }
    NoContent
  }


}
