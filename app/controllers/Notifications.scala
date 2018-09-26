package controllers

import java.nio.charset.StandardCharsets

import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import config.Config
import io.circe._
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint, SubscriptionKeys}
import nl.martijndwars.webpush.{Notification, PushService}
import play.api.mvc.Controller

import scala.concurrent.Future

object Notifications extends Controller with PanDomainAuthActions {
  import config.Config.defaultExecutionContext
  import Subscription.endpointDecoder

  private val subsApi = new SubscriptionsAPI(Config.stage)
  private val pushService = new PushService(Config.webPushPublicKey, Config.webPushPrivateKey, "mailto:digitalcms.bugs@guardian.co.uk")

  def addSubscription = APIAuthAction.async { request =>
    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      // TODO MRB: customisable queries
      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(Map.empty, None, endpoint)

      _ <- ApiResponseFt.Async.Right(subsApi.put(sub))
    } yield "Done")
  }

  // TODO MRB: remove test endpoint
  def testNotification = APIAuthAction.async { request =>
    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      _ <- ApiResponseFt.Async.Right(sendTestNotification(json))
    } yield "Done")
  }

  private def sendTestNotification(json: Json): Future[Unit] = {
    val payload = json.toString().getBytes(StandardCharsets.UTF_8)

    subsApi.getAll().map { subs =>
      subs.foreach { case Subscription(_, _, SubscriptionEndpoint(endpoint, SubscriptionKeys(p256dh, auth))) =>
        val notification = new Notification(endpoint, p256dh, auth, payload)
        pushService.send(notification)
      }
    }
  }
}
