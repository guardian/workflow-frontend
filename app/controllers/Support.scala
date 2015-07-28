package controllers

import com.gu.workflow.lib.{ClientLog, ClientMessageLoggable}
import play.api.Logger
import play.api.libs.json.Json
import play.api.mvc.Controller
import play.api.libs.Crypto

object Support extends Controller with PanDomainAuthActions {

  def encodeEmail(email: String) = {
    Crypto.encryptAES(email)
  }

  def adjust[A, B](m: Map[A, B], k: A)(f: B => B): Map[A,B] = {
      m.get(k).map(v => m.updated(k, f(v))).getOrElse(m)
  }


  def logger = APIAuthAction { implicit request =>
    println(request.body)
    println(request.user.email)

    (for {
        js <- request.body.asJson
        msg <- js.validate[ClientLog].asOpt
    } yield {
        val msgWithEmail = msg.copy(fields = msg.fields + ("userEmail" -> request.user.email))
        val logMsg  = msgWithEmail.copy(fields = msgWithEmail.fields.map(f => adjust(f, "userEmail")(encodeEmail)))
        ClientMessageLoggable.logClientMessage(logMsg)
    }).getOrElse {
      Logger.info(s"unrecognised message ${request.body}")
    }
    NoContent
  }


}
