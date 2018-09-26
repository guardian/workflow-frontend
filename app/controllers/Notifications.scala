package controllers

import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import com.gu.workflow.lib.QueryString
import config.Config
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint, SubscriptionUpdate}
import play.api.mvc.Controller

import scala.concurrent.Future

object Notifications extends Controller with PanDomainAuthActions {
  import Subscription.endpointDecoder
  import config.Config.defaultExecutionContext

  private val subsApi = new SubscriptionsAPI(Config.stage, Config.webPushPublicKey, Config.webPushPrivateKey)

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = QueryString.fromRequest(request)

    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      // TODO MRB: customisable queries
      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(qs, None, endpoint)

      _ <- ApiResponseFt.Right(subsApi.put(sub))
    } yield "Done")
  }

  // TODO MRB: remove test endpoint
  def testNotification = APIAuthAction.async {
    ApiResponseFt[String](for {
      _ <- ApiResponseFt.Right(sendTestNotification())
    } yield "Done")
  }

  private def sendTestNotification(): Unit = {
    subsApi.getAll().foreach { sub =>
      subsApi.sendNotification(SubscriptionUpdate("It's time for a beer"), sub.endpoint)
    }
  }
}
