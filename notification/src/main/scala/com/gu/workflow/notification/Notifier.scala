package com.gu.workflow.notification

import java.net.HttpCookie

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

  private val composerUrl = stage match {
    case Prod => "https://composer.gutools.co.uk"
    case _ => "https://composer.code.dev-gutools.co.uk"
  }

  def run(): Unit = {
    logger.info("I am the Workflow notifier!")
    subsApi.getAll().foreach(processSubscription)
  }

  private def processSubscription(sub: Subscription): Unit = {
    logger.info(s"Getting current results for ${sub.query}")

    val stubs = getStubs(sub.query)

    val oldSeenIds: Option[Map[Long, Status]] = sub.runtime.map(_.seenIds)
    val newSeenIds: Map[Long, Status] = stubs.flatMap { case(status, stub) => stub.id.map(_ -> status) }.toMap

    try {
      oldSeenIds match {
        case Some(existingSeenIds) =>
          val toNotify = calculateToNotify(existingSeenIds, newSeenIds, stubs)
          logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds")

          if (toNotify.isEmpty) {
            logger.info("Not sending any notifications")
          } else if(!sub.schedule.enabled) {
            logger.info("Not sending any notifications as subscription is disabled")
          } else {
            logger.info(s"Sending notifications for ${toNotify.map(_._2.id)}")

            notify(toNotify, sub, newSeenIds)
          }

        case None =>
          logger.info(s"No existing results for ${sub.query}. Now seen $newSeenIds. Not sending any notifications")
      }
    } finally {
      subsApi.put(sub.copy(runtime = Some(SubscriptionRuntime(newSeenIds))))
    }
  }

  private def calculateToNotify(allBefore: Map[Long, Status], allAfter: Map[Long, Status], stubs: List[(Status, Stub)]): List[(Status, Stub)] = {
    val ids = (allBefore.keySet ++ allAfter.keySet).toList

    ids.flatMap { id =>
      val before = allBefore.get(id)
      val after = allAfter.get(id)

      (before, after) match {
        case (Some(statusBefore), Some(statusAfter)) if statusAfter != statusBefore =>
          // The row has changed status
          stubs.find(_._2.id.contains(id))

        case (None, Some(_)) =>
          // A new row has appeared
          stubs.find(_._2.id.contains(id))

        case _ =>
          None
      }
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

  private def notify(stubs: List[(Status, Stub)], sub: Subscription, seenIds: Map[Long, Status]): Unit = {
    try {
      stubs.foreach { case (status, stub) =>
        // TODO MRB: atom edit URLs?
        val url = stub.composerId.map { id => s"$composerUrl/content/$id"}
        val body = stub.note.getOrElse("")
        val update = SubscriptionUpdate(s"${stub.title} now in $status", body, url)

        subsApi.sendNotification(update, sub.endpoint)
      }
    } catch {
      case NonFatal(e) =>
        logger.error(s"Error sending notification to ${sub.endpoint}. Removing subscription", e)
        subsApi.delete(Subscription.id(sub))
    }
  }
}
