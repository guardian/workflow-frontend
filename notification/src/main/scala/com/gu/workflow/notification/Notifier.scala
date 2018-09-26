package com.gu.workflow.notification

import com.gu.workflow.api.{CommonAPI, SubscriptionsAPI}
import com.gu.workflow.lib.QueryString
import io.circe.parser
import models.api.ContentResponse
import models.{Stub, Subscription, SubscriptionEndpoint, SubscriptionUpdate}
import play.api.Logger

import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext}
import scala.util.control.NonFatal

class Notifier(datastoreApiRoot: String, subsApi: SubscriptionsAPI)(implicit ec: ExecutionContext) {
  def run(): Unit = {
    // TODO MRB: build the notifier
    //  Why is it re-adding the subscription under a different queryId?
    //  Foreach subscription, load content, compare with previous, fire notifications, save seen ids
    //  groupby queryId to minimise load on workflow DB
    //  Remove subscription if notification fails to send
    //  Handle failures of futures

    // TODO MRB: use Slf4j logging to fix logging in the lambda
    Logger.info("I am the Workflow notifier!")
    subsApi.getAll().foreach(processSubscription)
  }

  private def processSubscription(sub: Subscription): Unit = {
    Logger.info(s"Getting current results for ${sub.query}")

    val stubs = getStubs(sub.query)
    val newSeenIds = stubs.flatMap(_.id).toSet

    try {
      sub.seenIds match {
        case Some(existingSeenIds) =>
          val toNotify = newSeenIds -- existingSeenIds

          if(toNotify.isEmpty) {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Not sending any notifications")
          } else {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Sending notifications for $toNotify")

            toNotify.foreach { id =>
              val stub = stubs.find(_.id.contains(id)).get
              notify(stub, sub.endpoint)
            }
          }

        case None =>
          Logger.info(s"No existing results for ${sub.query}. Now seen $newSeenIds. Not sending any notifications")
      }
    } catch {
      case NonFatal(e) =>
        Logger.error(s"Error sending notification for ${sub.query}", e)
    } finally {
      subsApi.put(sub.copy(seenIds = Some(newSeenIds)))
    }
  }

  private def getStubs(query: Subscription.Query): List[Stub] = {
    val response = requests.get(s"$datastoreApiRoot/stubs", params = QueryString.flatten(query))
    val json = parser.parse(response.text()).right.get

    val content = json.hcursor.downField("data").as[ContentResponse].right.get
    content.content.values.flatten.toList
  }

  private def notify(stub: Stub, endpoint: SubscriptionEndpoint): Unit = {
    // TODO: allow user to specify a name for the subscription and use it in the title
    val update = SubscriptionUpdate(s"${stub.title} updated")
    subsApi.sendNotification(update, endpoint)
  }
}
