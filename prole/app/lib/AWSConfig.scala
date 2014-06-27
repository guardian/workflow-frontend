package lib

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

  def getMessages(messageCount: Int): Future[List[Message]] = Future {
    sqsClient.receiveMessage(
      new ReceiveMessageRequest(queueUrl).withMaxNumberOfMessages(messageCount)
    ).getMessages.asScala.toList
  }

  def deleteMessage(message: Message): Future[Unit] = Future {
    sqsClient.deleteMessage(
      new DeleteMessageRequest(queueUrl, message.getReceiptHandle)
    )
  }

  def deleteMessages(messages: List[Message]) = Future {
    sqsClient.deleteMessageBatch(queueUrl,  messages.map(msgEntry(_)).asJava)
  }

  def msgEntry(message: Message): DeleteMessageBatchRequestEntry = {
    new DeleteMessageBatchRequestEntry(message.getMessageId, message.getReceiptHandle)
  }

  def toWireStatus(awsMsg: Message): JsResult[WireStatus] = {
    val body = Json.parse(awsMsg.getBody)
    (body \ "Message").validate[String].flatMap { msg =>
      Json.parse(msg).validate[WireStatus]
    }

  }
}
