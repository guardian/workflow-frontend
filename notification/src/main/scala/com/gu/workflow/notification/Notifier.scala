package com.gu.workflow.notification

import java.net.URI

import com.gu.hmac.HMACHeaders
import com.gu.workflow.api.SubscriptionsAPI
import com.gu.workflow.lib.QueryString
import io.circe.parser
import models.api.ContentResponse
import models.{Stub, Subscription, SubscriptionUpdate}
import play.api.Logger
import requests.Util

import scala.concurrent.ExecutionContext
import scala.util.control.NonFatal

class Notifier(stage: String, override val secret: String, subsApi: SubscriptionsAPI)
              (implicit ec: ExecutionContext) extends HMACHeaders {

  private val appUrl = stage match {
    case "PROD" => "https://workflow.gutools.co.uk"
    case "CODE" => "https://workflow.code.dev-gutools.co.uk"
    case "DEV" => "https://workflow.local.dev-gutools.co.uk"
  }

  def run(): Unit = {
    Logger.info("I am the Workflow notifier!")

    val subscriptions = subsApi.getAll()
    val subsByQuery = subscriptions.groupBy(_.query)

    subsByQuery.foreach { case(query, subs) =>
      processSubscriptions(query, subs)
    }
  }

  private def processSubscriptions(query: Subscription.Query, subs: Iterable[Subscription]): Unit = {
    Logger.info(s"Getting current results for $query")

    val stubs = getStubs(query)

    val oldSeenIds = subs.head.seenIds
    val newSeenIds = stubs.flatMap(_.id).toSet

    try {
      oldSeenIds match {
        case Some(existingSeenIds) =>
          val toNotify = newSeenIds -- existingSeenIds

          if(toNotify.isEmpty) {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Not sending any notifications")
          } else {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Sending notifications for $toNotify")

            val stubsToNotify = stubs.filter(_.id.exists(toNotify.contains))
            notify(stubsToNotify, subs)
          }

        case None =>
          Logger.info(s"No existing results for $query. Now seen $newSeenIds. Not sending any notifications")
      }
    } catch {
      case NonFatal(e) =>

    } finally {
      subs.foreach { sub =>
        subsApi.put(sub.copy(seenIds = Some(newSeenIds)))
      }
    }
  }

  private def getStubs(query: Subscription.Query): List[Stub] = {
    val url = s"$appUrl/stubs"
    val params = QueryString.flatten(query)

    val fullUrl = s"$url?${Util.urlEncode(params)}"
    val hmacHeaders = createHMACHeaderValues(new URI(fullUrl))

    val response = requests.get(
      url, params = params,
      headers = Seq(
        "X-Gu-Tools-Service-Name" -> "workflow-notifier",
        "X-Gu-Tools-HMAC-Token" -> hmacHeaders.token,
        "X-Gu-Tools-HMAC-Date" -> hmacHeaders.date
      )
    )

    val json = parser.parse(response.text()).right.get
    val content = json.hcursor.downField("data").as[ContentResponse].right.get

    content.content.values.flatten.toList
  }

  private def notify(stubs: List[Stub], subs: Iterable[Subscription]): Unit = {
    // TODO MRB: allow user to specify a name for the subscription and use it in the title
    subs.foreach { sub =>
      try {
        stubs.foreach { stub =>
          val update = SubscriptionUpdate(s"${stub.title} updated")
          subsApi.sendNotification(update, sub.endpoint)
        }

        subsApi.put(sub.copy(seenIds = Some(stubs.flatMap(_.id).toSet)))
      } catch {
        case NonFatal(e) =>
          Logger.error(s"Error sending notification to ${sub.endpoint}. Removing subscription", e)
          subsApi.delete(sub)
      }
    }
  }
}
