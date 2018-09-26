package com.gu.workflow.api

import com.gu.workflow.util.Dynamo
import models.Subscription

import scala.collection.JavaConverters._
import scala.concurrent.{ExecutionContext, Future}

class SubscriptionsAPI(stage: String)(implicit ec: ExecutionContext) extends Dynamo {
  private val tableName = s"workflow-subscriptions-${if(stage != "PROD") { "CODE" } else { "PROD" }}"
  private val table = dynamoDb.getTable(tableName)

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
}
