package com.gu.workflow.notification

import java.net.{HttpCookie, URLEncoder}

import com.gu.workflow.api.SubscriptionsAPI
import com.gu.workflow.lib.QueryString
import com.gu.workflow.util.{Dev, Prod, SharedSecretAuth, Stage}
import io.circe.parser
import models._
import models.api.ContentResponse
import play.api.Logging

import scala.util.control.NonFatal

class Notifier(stage: Stage, override val secret: String, subsApi: SubscriptionsAPI) extends SharedSecretAuth with Logging {

  private val appUrl = stage match {
    case Dev => "https://workflow.local.dev-gutools.co.uk"
    case stage => s"https://workflow.${stage.appDomain}"
  }

  def run(): Unit = {
    logger.info("I am the Workflow notifier!")
    subsApi.getAll().foreach(processSubscription)
  }

  private def processSubscription(sub: Subscription): Unit = {
    logger.info(s"Getting current results for ${sub.query}")

    val stubs = getStubs(sub.query)

    val oldSeenIds: Option[Set[Long]] = sub.runtime.map(_.seenIds.keySet)

    // Keep the Status in the notification map in case we want to switch back to sending a notification every time
    // a stub changes Status within the subscribed view (at the moment it's just when a new stub appears)
    val newSeenIdsWithStatus: Map[Long, Status] = stubs.flatMap { case(status, stub) => stub.id.map(_ -> status) }.toMap
    val newSeenIds: Set[Long] = newSeenIdsWithStatus.keySet

    try {
      oldSeenIds match {
        case Some(existingSeenIds) =>
          val toNotify = calculateToNotify(existingSeenIds, newSeenIds, stubs)

          logger.info(s"Old: $existingSeenIds")
          logger.info(s"New: $newSeenIds")

          if (toNotify.isEmpty) {
            logger.info("Not sending any notifications")
          } else if(!sub.schedule.enabled) {
            logger.info("Not sending any notifications as subscription is disabled")
          } else {
            logger.info(s"Sending notifications for ${toNotify.map(_._2.id)}")

            notify(toNotify, sub)
          }

        case None =>
          logger.info(s"No existing results for ${sub.query}. Now seen $newSeenIds. Not sending any notifications")
      }
    } finally {
      subsApi.put(sub.copy(runtime = Some(SubscriptionRuntime(newSeenIdsWithStatus))))
    }
  }

  private def calculateToNotify(idsBefore: Set[Long], idsAfter: Set[Long], stubs: List[(Status, Stub)]): List[(Status, Stub)] = {
    idsAfter.diff(idsBefore).toList.flatMap { id =>
      stubs.find(_._2.id.contains(id))
    }
  }

  private def getStubs(query: Subscription.Query): List[(Status, Stub)] = {
    import com.gu.workflow.util.SharedSecretAuth._

    val response = requests.get(
      s"$appUrl/sharedsecret/content",
      params = QueryString.flatten(query),
      cookies = Map(
        cookieName -> new HttpCookie(cookieName, sharedSecret.head)
      )
    )

    val responseText = response.text()

    parser.parse(responseText) match {
      case Right(json) =>
        val content = json.as[ContentResponse].right.get
        val allStubs = content.content.toList

        allStubs.flatMap { case(status, stubs) =>
          Status.withNameOption(status).toList.flatMap { status =>
            stubs.map(status -> _)
          }
        }

      case Left(err) =>
        logger.error(s"Unable to get stubs for $query: ${response.statusCode} $responseText", err)
        throw err.underlying
    }
  }

  private def notify(stubs: List[(Status, Stub)], sub: Subscription): Unit = {
    try {
      stubs.foreach { case (status, stub) =>
        // TODO MRB: atom edit URLs?
        val url = buildDashboardUrl(sub.query)

        val title = sub.description.getOrElse(status.toString)
        val body = stub.title

        val update = SubscriptionUpdate(title, body, url)

        subsApi.sendNotification(update, sub.endpoint)
      }
    } catch {
      case NonFatal(e) =>
        logger.error(s"Error sending notification to ${sub.endpoint}. Removing subscription", e)
        subsApi.delete(Subscription.id(sub))
    }
  }

  private def buildDashboardUrl(query: Subscription.Query): String = {
    val params = (query - "email").flatMap { case(key, values) =>
      values.map { value =>
        s"${URLEncoder.encode(key, "UTF-8")}=${URLEncoder.encode(value, "UTF-8")}"
      }
    }.mkString("&")

    s"$appUrl/dashboard?$params"
  }
}
