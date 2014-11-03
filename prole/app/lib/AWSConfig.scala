package lib

import java.util.Date

import com.amazonaws.services.cloudwatch.AmazonCloudWatchAsyncClient
import com.amazonaws.services.cloudwatch.model.{StandardUnit, MetricDatum, PutMetricDataRequest}

import scala.collection.JavaConverters._
import scala.concurrent.{ExecutionContext, Future}
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json.{JsResult, Json}
import com.amazonaws.services.sqs.model._
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.sqs.AmazonSQSClient
import models.WireStatus


object AWSCreds {

  private val accessKey = ProleConfiguration.apply.awsKey
  private val secret = ProleConfiguration.apply.awsSecret

  lazy val basic = new BasicAWSCredentials(accessKey, secret)
}

object AWSWorkflowQueue {

  lazy val sqsClient = {
    val client = new AmazonSQSClient(AWSCreds.basic)
    client.setEndpoint("sqs.eu-west-1.amazonaws.com")
    client
  }

  lazy val queueUrl = ProleConfiguration.apply.flexNotificationsQ

  def getMessages(messageCount: Int = 1, waitTimeSeconds: Int = 1): List[Message] = {
    sqsClient.receiveMessage(
      new ReceiveMessageRequest(queueUrl).withWaitTimeSeconds(1).withMaxNumberOfMessages(messageCount)
    ).getMessages.asScala.toList
  }

  def deleteMessage(message: Message) {
    sqsClient.deleteMessage(
      new DeleteMessageRequest(queueUrl, message.getReceiptHandle)
    )
  }

  def toWireStatus(awsMsg: Message): JsResult[WireStatus] = {
    val body = Json.parse(awsMsg.getBody)
    (body \ "Message").validate[String].flatMap { msg =>
      Json.parse(msg).validate[WireStatus]
    }
  }
}

object CloudWatch {
  lazy val stage = "CODE"
  lazy val namespace = s"$stage/Prole"

  lazy val client = {
    val client = new AmazonCloudWatchAsyncClient(AWSCreds.basic)
    client.setEndpoint("sqs.eu-west-1.amazonaws.com")
    client
  }

  def recordMessageProcessed { recordEvent("ProcessedMessages") }

  def recordMessageError { recordEvent("FailedMessages") }

  def recordUntrackedContentMessage { recordEvent("UntrackedContentMessages") }

  private def recordEvent(metricName: String) = {
    val eventDatum = new MetricDatum().withMetricName(metricName).withValue(1.0).withUnit(StandardUnit.Count).withTimestamp(new Date())
    val metricData = new PutMetricDataRequest().withNamespace(namespace).withMetricData(eventDatum)
    client.putMetricDataAsync(metricData)
  }

}
