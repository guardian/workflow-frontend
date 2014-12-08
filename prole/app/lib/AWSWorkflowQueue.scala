package lib

import scala.collection.JavaConverters._
import play.api.libs.json.{JsValue, Reads, JsPath, JsResult, Json, JsError, JsSuccess}
import play.api.Logger
import org.joda.time.DateTime
import com.amazonaws.services.sqs.AmazonSQSClient
import com.amazonaws.services.sqs.model._
import models.{ContentUpdateEvent, LifecycleEvent, WorkflowNotification}
import play.api.data.validation.ValidationError

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

  def recordMessageParsingError(e: Seq[(JsPath, Seq[ValidationError])]) = {
    Logger.error(s"error parsing message to notification: $e")
    CloudWatch.recordMessageError
  }

  def deserializeMessageBody[T: Reads](body: JsValue): Option[T] = {
    (body \  "Message").validate[String].flatMap { msg =>
      Json.parse(msg).validate[T]
    } match {
      case JsError(e) => recordMessageParsingError(e); None
      case JsSuccess(n, _) => Some(n)
    }
  }

  def parseMessage(awsMsg: Message): Option[WorkflowNotification] = {
    val body = Json.parse(awsMsg.getBody)

    Logger.trace(s"received message: ${awsMsg.getBody}")

    (body \ "Subject").validate[String] match {
      case JsError(e)      => recordMessageParsingError(e); None
      case JsSuccess(n, _) => n match { 
        case "fc-lifecycle.v2" => deserializeMessageBody[LifecycleEvent](body)
        case "fc-content.v1"   => deserializeMessageBody[ContentUpdateEvent](body)
        case _ => Logger.error(s"message type unrecognised: $n"); None
      }
    }
  } 
}

