package controllers

import java.util.Date
import play.api.libs.Crypto.sign
import scala.concurrent.Future
import play.api.mvc._
import scala.concurrent.ExecutionContext.Implicits.global
import com.gu.workflow.lib.Config

object SharedSecretAuthAction extends ActionBuilder[Request] {

  val devmode = true
  val cookieName = "workflow-secret"
  val sharedKey = Config.getConfigString("api.sharedsecret")
    .right.getOrElse("changeme").getBytes

  // openssl sha1 -hmac "ABC"
  def sharedSecret = {
    if(devmode) {
      "changeme"
    } else {
      val plaintext = ((new Date().getTime) & ~(Math.pow(2,16).toLong - 1)).toString
      sign(plaintext, sharedKey)
    }
  }

  def isInOnTheSecret(req: Request[_]): Boolean =
    req.cookies.get(cookieName).map(_.value == sharedSecret).getOrElse(false)

  def invokeBlock[A](req: Request[A], block: (Request[A]) => Future[Result]) =
    if(!isInOnTheSecret(req))
      Future(Results.Forbidden)
    else
      block(req)

}
