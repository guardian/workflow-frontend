package controllers

import com.gu.pandomainauth.model.User
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
    val subs = getUserSubs(request.user)
    Ok(views.html.subscriptions(subs.toList))
  }

  def deleteSubscription = AuthAction(parse.form(Subscription.form)) { request =>
    val id = request.body.id

    subsApi.delete(id)

    val updated = getUserSubs(request.user).filterNot { s => Subscription.id(s) == id }
    Ok(views.html.subscriptions(updated.toList))
  }

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = Api.queryString(request)
    val userAgent = request.headers.get("User-Agent").getOrElse("unknown")

    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(request.user.email, userAgent, qs, endpoint, runtime = None)

      _ <- ApiResponseFt.Right(subsApi.put(sub))
    } yield "Done")
  }

  private def getUserSubs(user: User): Iterable[Subscription] = {
    subsApi.getAll().filter(_.email == user.email)
  }
}
