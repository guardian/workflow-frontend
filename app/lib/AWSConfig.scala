package lib

import scala.collection.JavaConverters._
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.sqs.AmazonSQSClient
import com.amazonaws.services.sqs.model.{DeleteMessageRequest, ReceiveMessageRequest, Message}
import models.{Stub, WireStatus}
import play.api.libs.json.Json
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model.{ObjectMetadata, PutObjectRequest, GetObjectRequest, Bucket}
import java.io.ByteArrayInputStream
import scala.concurrent.{ExecutionContext, Future}
import scala.io.Source
import ExecutionContext.Implicits.global
import scala.util.Try


object AWSCreds {
  import play.api.Play.current
  val config = play.api.Play.configuration

  private val accessKey = config.getString("aws.key").getOrElse("blah")
  private val secret = config.getString("aws.secret").getOrElse("blah")

  lazy val basic = new BasicAWSCredentials(accessKey, secret)
}

object AWSWorkflowBucket {

  lazy val s3Client = new AmazonS3Client(AWSCreds.basic)

  lazy val name = AWSCreds.config.getString("aws.stub.bucket").getOrElse(sys.error("Required: aws.stub.bucket"))

  lazy val key = "tmp/stubs.txt"

  //reads stubs file
  def readStubsFile: Future[String] = {
    for {
      stubsFile <- Future(AWSWorkflowBucket.s3Client.getObject(new GetObjectRequest(name, key)))
      stream <- Future(stubsFile.getObjectContent)
    } yield {
      val is = Source.fromInputStream(stream)
      is.getLines.mkString
    }
  }

  def parseStubsJson(s: String): List[Stub] = {
    Try(Json.parse(s)).toOption
      .flatMap(_.validate[List[Stub]].asOpt)
      .getOrElse(Nil)
  }


  def add(newStub: Stub) = {
    AWSWorkflowBucket.readStubsFile.map { str =>
      val existingStubs = parseStubsJson(str)
      val stubsJson = Json.toJson(newStub :: existingStubs)
      val stream = new ByteArrayInputStream(stubsJson.toString.getBytes("UTF-8"));
      val putObjRequest = new PutObjectRequest(name, key, stream, new ObjectMetadata())
      AWSWorkflowBucket.s3Client.putObject(putObjRequest)
    }
  }
}

object AWSWorkflowQueue {

  lazy val sqsClient = {
    val client = new AmazonSQSClient(AWSCreds.basic)
    client.setEndpoint("sqs.eu-west-1.amazonaws.com")
    client
  }

  lazy val queueUrl = AWSCreds.config.getString("aws.flex.notifications.queue")
    .getOrElse(sys.error("Required: aws.flex.notifications.queue"))

  def getMessages(messageCount: Int): scala.collection.immutable.List[Message] = {
    val response = sqsClient.receiveMessage(
      new ReceiveMessageRequest(queueUrl).withMaxNumberOfMessages(messageCount)
    )
    response.getMessages.asScala.toList
  }

  def deleteMessage(message: Message) {
    sqsClient.deleteMessage(
      new DeleteMessageRequest(queueUrl, message.getReceiptHandle)
    )
  }

  def toWireStatus(awsMsg: Message): WireStatus = {
    val body = Json.parse(awsMsg.getBody)
    val msg = Json.parse((body \ "Message").as[String])
    msg.as[WireStatus]
  }
}