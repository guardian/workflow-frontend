package com.gu.workflow.api

import java.nio.charset.StandardCharsets
import java.security.Security

import com.gu.workflow.util.{Dynamo, Prod, Stage}
import io.circe.syntax._
import models.{Subscription, SubscriptionEndpoint, SubscriptionUpdate}
import nl.martijndwars.webpush.{Notification, PushService}
import play.api.Logging
import org.bouncycastle.jce.provider.BouncyCastleProvider
import scala.jdk.CollectionConverters._

class SubscriptionsAPI(stage: Stage, webPushPublicKey: String, webPushPrivateKey: String) extends Dynamo with Logging {
  private val tableName = stage match {
    case Prod => "workflow-subscriptions-PROD"
    case _ => "workflow-subscriptions-CODE"
  }

  private val table = dynamoDb.getTable(tableName)

  Security.addProvider(new BouncyCastleProvider())
  private val pushService = new PushService(webPushPublicKey, webPushPrivateKey, "mailto:digitalcms.bugs@guardian.co.uk")

  def get(id: String): Option[Subscription] = {
    Option(table.getItem("id", id)).map(Subscription.fromItem)
  }

  def put(subscription: Subscription): Subscription = {
    val item = Subscription.toItem(subscription)

    table.putItem(item)
    subscription
  }

  def delete(id: String): Unit = {
    table.deleteItem("id", id)
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
    val resp = pushService.send(notification)

    if(resp.getStatusLine.getStatusCode != 201) {
      logger.error(s"Error sending notification. ${resp.getStatusLine.getStatusCode}. Endpoint: $endpoint")
    }
  }
}
