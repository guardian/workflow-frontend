package controllers

import java.nio.charset.StandardCharsets
import java.security.{KeyFactory, PublicKey}
import java.util.Base64

import com.gu.workflow.api.ApiUtils
import config.Config
import models.api.ApiResponseFt
import play.api.mvc.Controller
import io.circe.Decoder.Result
import io.circe._
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import models.ExternalData
import nl.martijndwars.webpush.{Notification, PushService}
import org.bouncycastle.jce.ECNamedCurveTable
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.jce.spec.ECPublicKeySpec

case class SubscriptionKeys(p256dh: String, auth: String)
object SubscriptionKeys {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val decoder: Decoder[SubscriptionKeys] = deriveDecoder
}

case class Subscription(endpoint: String, keys: SubscriptionKeys)

object Subscription {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val decoder: Decoder[Subscription] = deriveDecoder
}

object Notifications extends Controller with PanDomainAuthActions {
  import config.Config.defaultExecutionContext

  // TODO MRB: persist and distribute
  private var subs = Set.empty[Subscription]

  private val pushService = new PushService(Config.webPushPublicKey, Config.webPushPrivateKey, "mailto:digitalcms.bugs@guardian.co.uk")

  def addSubscription = APIAuthAction.async { request =>
    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      sub <- ApiUtils.extractResponse[Subscription](json)
      _ = subs += sub
    } yield "Done")
  }

  // TODO MRB: remove test endpoint
  def testNotification = APIAuthAction.async { request =>
    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      _ = sendTestNotification(json)
    } yield "Done")
  }

  private def sendTestNotification(json: Json): Unit = {
    val payload = json.toString().getBytes(StandardCharsets.UTF_8)

    subs.foreach { case Subscription(endpoint, SubscriptionKeys(p256dh, auth)) =>
      val notification = new Notification(endpoint, p256dh, auth, payload)
      pushService.send(notification)
    }
  }
}
