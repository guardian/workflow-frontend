package com.gu.workflow.util

import java.util.Date

import com.gu.workflow.lib.Config
import play.api.libs.Crypto.sign
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object SharedSecretAuthAction extends ActionBuilder[Request] {

  val devmode = true
  val cookieName = "workflow-secret"
  val sharedKey = Config.getConfigString("api.sharedsecret")
    .right.getOrElse("changeme").getBytes

  val mask = Math.pow(2, 16).toLong - 1

  // openssl sha1 -hmac "ABC"
  def sharedSecret: Seq[String] = {
    val code = ((new Date().getTime) & ~(mask))
    // give some grace on either side
    List(code - (mask + 1), code, code + (mask + 1)).map(time => sign(time.toString, sharedKey))
  }

  def matchesSharedSecret(candidate: String): Boolean = sharedSecret.exists({ x => println(s"comparing $x to $candidate"); x == candidate })

  def isInOnTheSecret(req: Request[_]): Boolean =
    req.cookies.get(cookieName).map(cookie => matchesSharedSecret(cookie.value)).getOrElse(false)

  def invokeBlock[A](req: Request[A], block: (Request[A]) => Future[Result]) =
    if(!isInOnTheSecret(req))
      Future(Results.Forbidden)
    else
      block(req)

}
