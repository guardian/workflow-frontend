package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.model.User
import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import config.Config
import config.Config.defaultExecutionContext
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint, SubscriptionSchedule}
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

class Notifications(
  val apiUtils: ApiUtils,
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions {
  import Subscription.endpointDecoder

  private val subsApi = new SubscriptionsAPI(config.stage, config.webPushPublicKey, config.webPushPrivateKey)

  def subscriptions = AuthAction { request =>
    val subs = getUserSubs(request.user)
    Ok(views.html.subscriptions(subs.toList))
  }

  def updateSubscription = AuthAction(parse.form(Subscription.form)) { request =>
    val (id, enabled, delete) = request.body

    if(delete.contains(true)) {
      val updated = deleteSub(id, request.user)
      Ok(views.html.subscriptions(updated.toList))
    } else {
      subsApi.get(id) match {
        case Some(before) =>
          val updated = updateSub(id, enabled, before, request.user)
          Ok(views.html.subscriptions(updated.toList))

        case None =>
          NotFound(s"Subscription $id does not exist")
      }
    }
  }

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = Api.queryString(request)
    val userAgent = request.headers.get("User-Agent").getOrElse("unknown")

    ApiResponseFt[String](for {
      json <- apiUtils.readJsonFromRequestResponse(request.body)

      endpoint <- apiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(request.user.email, userAgent, qs, endpoint,
        schedule = SubscriptionSchedule(enabled = true), runtime = None)

      _ <- ApiResponseFt.Right(subsApi.put(sub))
    } yield "Done")
  }

  private def updateSub(id: String, enabled: Boolean, before: Subscription, user: User): Iterable[Subscription] = {
    val after = before.copy(schedule = before.schedule.copy(enabled = enabled))
    subsApi.put(after)

    getUserSubs(user).map {
      case sub if Subscription.id(sub) == id => after
      case sub => sub
    }
  }

  private def deleteSub(id: String, user: User): Iterable[Subscription] = {
    subsApi.delete(id)
    getUserSubs(user).filterNot { s => Subscription.id(s) == id }
  }

  private def getUserSubs(user: User): Iterable[Subscription] = {
    subsApi.getAll().filter(_.email == user.email)
  }
}
