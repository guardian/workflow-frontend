package controllers

import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import config.Config
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint}
import play.api.mvc.Controller

object Notifications extends Controller with PanDomainAuthActions {
  import Subscription.endpointDecoder
  import config.Config.defaultExecutionContext

  private val subsApi = new SubscriptionsAPI(Config.stage, Config.webPushPublicKey, Config.webPushPrivateKey)

  def subscriptions = AuthAction { request =>
    val subs = subsApi.getAll().filter(_.email == request.user.email)
    Ok(views.html.subscriptions(subs.toList))
  }

  def deleteSubscription = AuthAction(parse.form(Subscription.form)) { request =>
    val id = request.body.id

    subsApi.delete(id)

    val updated = subsApi.getAll().filterNot { s => Subscription.id(s) == id }
    Ok(views.html.subscriptions(updated.toList))
  }

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = Api.queryString(request)

    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(request.user.email, qs, None, endpoint)

      _ <- ApiResponseFt.Right(subsApi.put(sub))
    } yield "Done")
  }
}
