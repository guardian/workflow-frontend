package controllers

import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import com.gu.workflow.lib.QueryString
import config.Config
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint}
import play.api.mvc.Controller

object Notifications extends Controller with PanDomainAuthActions {
  import Subscription.endpointDecoder
  import config.Config.defaultExecutionContext

  private val subsApi = new SubscriptionsAPI(Config.stage, Config.webPushPublicKey, Config.webPushPrivateKey)

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = Api.queryString(request)

    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(qs, None, endpoint)

      _ <- ApiResponseFt.Right(subsApi.put(sub))
    } yield "Done")
  }
}
