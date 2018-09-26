package controllers

import com.gu.workflow.api.{ApiUtils, SubscriptionsAPI}
import com.gu.workflow.lib.Notifier
import config.Config
import io.circe._
import lib.QueryString
import models.api.ApiResponseFt
import models.{Subscription, SubscriptionEndpoint}
import play.api.Logger
import play.api.mvc.Controller

import scala.concurrent.Future
import scala.concurrent.duration._

object Notifications extends Controller with PanDomainAuthActions {
  import Subscription.endpointDecoder
  import config.Config.defaultExecutionContext

  private val subsApi = new SubscriptionsAPI(Config.stage, Config.webPushPublicKey, Config.webPushPrivateKey)

  if(Config.stage == "DEV") {
    runNotifierLocally()
  }

  def addSubscription = APIAuthAction.async { request =>
    val qs: Map[String, Seq[String]] = QueryString.fromRequest(request)

    ApiResponseFt[String](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)

      // TODO MRB: customisable queries
      endpoint <- ApiUtils.extractResponse[SubscriptionEndpoint](json)
      sub = Subscription(qs, None, endpoint)

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
    subsApi.getAll().map { subs =>
      subs.foreach { sub =>
        subsApi.sendNotification(json, sub.endpoint)
      }
    }
  }

  private def runNotifierLocally(): Unit = {
    Logger.info("Running the notifier locally every 30 seconds")
    val notifier = new Notifier(subsApi)

    actorSystem.scheduler.schedule(0.seconds, 30.seconds) { notifier.run() }
  }
}
