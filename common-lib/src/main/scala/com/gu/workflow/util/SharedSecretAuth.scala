package com.gu.workflow.util

import java.util.Date

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import play.api.libs.Codecs
import play.api.mvc._

trait SharedSecretAuth {
  import SharedSecretAuth._

  def secret: String

  val mask = Math.pow(2, 16).toLong - 1

  // openssl sha1 -hmac "ABC"
  def sharedSecret: Seq[String] = {
    val code = ((new Date().getTime) & ~(mask))
    // give some grace on either side
    List(code - (mask + 1), code, code + (mask + 1)).map(time => sign(time.toString))
  }

  def matchesSharedSecret(candidate: String): Boolean = sharedSecret.exists({ x => println(s"comparing $x to $candidate"); x == candidate })

  def isInOnTheSecret(req: Request[_]): Boolean =
    req.cookies.get(cookieName).map(cookie => matchesSharedSecret(cookie.value)).getOrElse(false)

  private def sign(message: String): String = {
    // Copy paste from Play Crypto so that we can use it without a running Play App (ie in a lambda)
    // NB: we should also migrate to panda-hmac and SHA-256
    val mac = Mac.getInstance("HmacSHA1")
    mac.init(new SecretKeySpec(secret.getBytes, "HmacSHA1"))
    Codecs.toHexString(mac.doFinal(message.getBytes("utf-8")))
  }
}

object SharedSecretAuth {
  val cookieName = "workflow-secret"
}
