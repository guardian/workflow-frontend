package com.gu.workflow.api

import java.nio.charset.StandardCharsets

import com.gu.workflow.util.Dynamo
import io.circe.Json
import models.{Subscription, SubscriptionEndpoint}
import nl.martijndwars.webpush.{Notification, PushService}

import scala.collection.JavaConverters._
import scala.concurrent.{ExecutionContext, Future}

class SubscriptionsAPI(stage: String, webPushPublicKey: String, webPushPrivateKey: String)(implicit ec: ExecutionContext) extends Dynamo {
  private val tableName = s"workflow-subscriptions-${if(stage != "PROD") { "CODE" } else { "PROD" }}"
  private val table = dynamoDb.getTable(tableName)

  private val pushService = new PushService(webPushPublicKey, webPushPrivateKey, "mailto:digitalcms.bugs@guardian.co.uk")

  def put(subscription: Subscription): Future[Subscription] = Future {
    val item = Subscription.toItem(subscription)

    // TODO MRB: dynamo async client?
    table.putItem(item)
    subscription
  }

  // TODO MRB: pages!
  def getAll(): Future[Iterable[Subscription]] = Future {
    val raw = table.scan().asScala
    raw.map(Subscription.fromItem)
  }

  def sendNotification(content: Json, endpoint: SubscriptionEndpoint): Unit = {
    val payload = content.toString().getBytes(StandardCharsets.UTF_8)
    val notification = new Notification(endpoint.endpoint, endpoint.keys.p256dh, endpoint.keys.auth, payload)

    pushService.send(notification)
  }
}
