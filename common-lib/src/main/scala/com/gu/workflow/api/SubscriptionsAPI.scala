package com.gu.workflow.api

import java.nio.charset.StandardCharsets

import com.gu.workflow.util.Dynamo
import io.circe.syntax._
import models.{Subscription, SubscriptionEndpoint, SubscriptionUpdate}
import nl.martijndwars.webpush.{Notification, PushService}

import scala.collection.JavaConverters._

class SubscriptionsAPI(stage: String, webPushPublicKey: String, webPushPrivateKey: String) extends Dynamo {
  private val tableName = s"workflow-subscriptions-${if(stage != "PROD") { "CODE" } else { "PROD" }}"
  private val table = dynamoDb.getTable(tableName)

  private val pushService = new PushService(webPushPublicKey, webPushPrivateKey, "mailto:digitalcms.bugs@guardian.co.uk")

  def put(subscription: Subscription): Subscription = {
    val item = Subscription.toItem(subscription)

    table.putItem(item)
    subscription
  }

  def delete(sub: Subscription): Unit = {
    table.deleteItem("id", Subscription.id(sub.endpoint))
  }

  def getAll(): Iterable[Subscription] = {
    // TODO MRB: handle more results than the default scan page size
    val raw = table.scan().asScala
    raw.map(Subscription.fromItem)
  }

  def sendNotification(update: SubscriptionUpdate, endpoint: SubscriptionEndpoint): Unit = {
    val json = update.asJson(Subscription.updateEncoder).toString()
    val payload = json.getBytes(StandardCharsets.UTF_8)

    val notification = new Notification(endpoint.endpoint, endpoint.keys.p256dh, endpoint.keys.auth, payload)

    pushService.send(notification)
  }
}
