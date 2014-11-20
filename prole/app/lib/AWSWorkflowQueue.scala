package lib

import scala.collection.JavaConverters._
import play.api.libs.json.{JsResult, Json, JsError, JsSuccess}
import play.api.Logger
import org.joda.time.DateTime
import com.amazonaws.services.sqs.AmazonSQSClient
import com.amazonaws.services.sqs.model._
import models.{WireStatus, LifecycleEvent, WorkflowNotification}

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

  def parseMessage(awsMsg: Message): Option[WorkflowNotification] = {
    val body = Json.parse(awsMsg.getBody)
    
    (body \ "Message").validate[String].flatMap { msg =>
      Json.parse(msg).validate[WireStatus] orElse
      Json.parse(msg).validate[LifecycleEvent]
    } match {
      case JsError(e) => {
        Logger.error(s"error parsing message to notification: $e")
        CloudWatch.recordMessageError

        None
      }
      case JsSuccess(n, _) => Some(n)
    }
  } 

  def toWireStatus(awsMsg: Message): JsResult[WireStatus] = {
    val body = Json.parse(awsMsg.getBody)
    (body \ "Message").validate[String].flatMap { msg =>
      Json.parse(msg).validate[WireStatus]
    }
  }
}

