package com.gu.workflow.notification

import java.net.HttpCookie

import com.gu.workflow.api.SubscriptionsAPI
import com.gu.workflow.lib.QueryString
import com.gu.workflow.util.SharedSecretAuth
import io.circe.parser
import models.api.ContentResponse
import models._
import play.api.Logger

import scala.util.control.NonFatal

class Notifier(stage: String, override val secret: String, subsApi: SubscriptionsAPI) extends SharedSecretAuth {

  private val appUrl = stage match {
    case "PROD" => "https://workflow.gutools.co.uk"
    case "CODE" => "https://workflow.code.dev-gutools.co.uk"
    // TODO MRB: put this back to https://workflow.local.dev-gutools.co.uk
    //           by convincing the JVM that our local dev cert is totes legit
    case "DEV" => "http://localhost:9090"
  }

  private val composerUrl = stage match {
    case "PROD" => "https://composer.gutools.co.uk"
    case _ => "https://composer.code.dev-gutools.co.uk"
  }

  def run(): Unit = {
    Logger.info("I am the Workflow notifier!")
    subsApi.getAll().foreach(processSubscription)
  }

  private def processSubscription(sub: Subscription): Unit = {
    Logger.info(s"Getting current results for ${sub.query}")

    val stubs = getStubs(sub.query)

    val oldSeenIds: Option[Map[Long, Status]] = sub.runtime.map(_.seenIds)
    val newSeenIds: Map[Long, Status] = stubs.flatMap { case(status, stub) => stub.id.map(_ -> status) }.toMap

    try {
      oldSeenIds match {
        case Some(existingSeenIds) =>
          val toNotify = calculateToNotify(existingSeenIds, newSeenIds, stubs)

          if (toNotify.isEmpty) {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Not sending any notifications")
          } else {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Sending notifications for ${toNotify.map(_._2.id)}")

            notify(toNotify, sub, newSeenIds)
          }

        case None =>
          Logger.info(s"No existing results for ${sub.query}. Now seen $newSeenIds. Not sending any notifications")
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
        Logger.error(s"Unable to get stubs for $query: ${response.statusCode} $responseText", err)
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
        Logger.error(s"Error sending notification to ${sub.endpoint}. Removing subscription", e)
        subsApi.delete(Subscription.id(sub))
    }
  }
}
