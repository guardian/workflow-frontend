package com.gu.workflow.notification

import java.net.HttpCookie

import com.gu.workflow.api.SubscriptionsAPI
import com.gu.workflow.lib.QueryString
import com.gu.workflow.util.SharedSecretAuth
import io.circe.parser
import models.api.ContentResponse
import models.{Stub, Subscription, SubscriptionUpdate}
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
    val newSeenIds = stubs.flatMap(_._2.id).toSet

    try {
      oldSeenIds match {
        case Some(existingSeenIds) =>
          val toNotify = newSeenIds -- existingSeenIds

          if(toNotify.isEmpty) {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Not sending any notifications")
          } else {
            Logger.info(s"Previously seen $existingSeenIds. Now seen $newSeenIds. Sending notifications for $toNotify")

            val stubsToNotify = stubs.filter(_._2.id.exists(toNotify.contains))
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

  private def getStubs(query: Subscription.Query): List[(String, Stub)] = {
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
          stubs.map(status -> _)
        }

      case Left(err) =>
        Logger.error(s"Unable to get stubs for $query: ${response.statusCode} $responseText", err)
        throw err.underlying
    }
  }

  private def notify(stubs: List[(String, Stub)], subs: Iterable[Subscription]): Unit = {
    // TODO MRB: allow user to specify a name for the subscription and use it in the title
    subs.foreach { sub =>
      try {
        stubs.foreach { case (status, stub) =>
          // TODO MRB: atom edit URLs?
          val url = stub.composerId.map { id => s"$composerUrl/content/$id"}
          val body = stub.note.getOrElse("")
          val update = SubscriptionUpdate(s"${stub.title} now in $status", body, url)

          subsApi.sendNotification(update, sub.endpoint)
        }

        subsApi.put(sub.copy(seenIds = Some(stubs.flatMap(_._2.id).toSet)))
      } catch {
        case NonFatal(e) =>
          Logger.error(s"Error sending notification to ${sub.endpoint}. Removing subscription", e)
          subsApi.delete(sub)
      }
    }
  }
}
