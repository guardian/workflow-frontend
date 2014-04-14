package lib

import scala.collection.JavaConverters._
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.sqs.AmazonSQSClient
import com.amazonaws.services.sqs.model.{ReceiveMessageRequest, Message, GetQueueUrlRequest}
import models.WorkflowContent
import play.api.libs.json.Json

object AWSWorkflowQueue {
  import play.api.Play.current
  val config = play.api.Play.configuration

  lazy val accessKey = config.getString("aws.key").getOrElse("blah")
  lazy val secret = config.getString("aws.secret").getOrElse("blah")

  lazy val awsCredentials = new BasicAWSCredentials(accessKey, secret)
  lazy val sqsClient = {
    val client = new AmazonSQSClient(awsCredentials)
    client.setEndpoint("sqs.eu-west-1.amazonaws.com")
    client
  }

  lazy val queueUrl = {

    val queueNameLookupResponse = sqsClient.getQueueUrl(new GetQueueUrlRequest("workflow-PROD"))

    queueNameLookupResponse.getQueueUrl
  }

  def getMessages(messageCount: Int): scala.collection.immutable.List[Message] = {
    val response = sqsClient.receiveMessage(
      new ReceiveMessageRequest(queueUrl).withMaxNumberOfMessages(messageCount)
    )
    response.getMessages.asScala.toList
  }

  def parseMessage(awsMsg: Message): WorkflowContent = {
    val body = Json.parse(awsMsg.getBody)
    val msg = Json.parse((body \ "Message").as[String])
    msg.as[WorkflowContent]
  }
}