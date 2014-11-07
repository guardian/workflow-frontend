package lib

import java.util.Date
import java.util.concurrent.atomic.AtomicLong

import akka.actor.{Props, Actor}
import akka.actor.Actor.Receive
import com.amazonaws.services.cloudwatch.AmazonCloudWatchAsyncClient
import com.amazonaws.services.cloudwatch.model.{Dimension, StandardUnit, MetricDatum, PutMetricDataRequest}
import com.amazonaws.services.ec2.model.{Filter, DescribeTagsRequest}
import com.amazonaws.services.ec2.{AmazonEC2Client, AmazonEC2AsyncClient}
import com.amazonaws.util.EC2MetadataUtils
import play.api.Logger
import play.api.libs.concurrent.Akka
import play.api.Play.current
import scala.language.postfixOps
import scala.collection.JavaConverters._
import scala.concurrent.{ExecutionContext, Future}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
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

trait AwsInstanceTags {

  lazy val instanceId = Option(EC2MetadataUtils.getInstanceId)

  lazy val ec2Client = {
    val client = new AmazonEC2Client(AWSCreds.basic)
    client.setEndpoint("ec2.eu-west-1.amazonaws.com")
    client
  }

  def readTag(tagName: String) = {
    instanceId.flatMap { id =>
      val tagsResult = ec2Client.describeTags(
        new DescribeTagsRequest().withFilters(
          new Filter("resource-type").withValues("instance"),
          new Filter("resource-id").withValues(id),
          new Filter("key").withValues(tagName)
        )
      )
      tagsResult.getTags.asScala.find(_.getKey == tagName).map(_.getValue)
    }
  }

}

object CloudWatch extends AwsInstanceTags {

  lazy val stageOpt = readTag("Stage")
  lazy val appOpt = readTag("App")

  lazy val cloudwatchClient = {
    val client = new AmazonCloudWatchAsyncClient(AWSCreds.basic)
    client.setEndpoint("monitoring.eu-west-1.amazonaws.com")
    client
  }

  val processedMessages = new AtomicLong()
  val failedMessages = new AtomicLong()
  val untrackedContentMessages = new AtomicLong()

  def recordMessageProcessed { processedMessages.incrementAndGet }

  def recordMessageError { failedMessages.incrementAndGet }

  def recordUntrackedContentMessage { untrackedContentMessages.incrementAndGet }

  def start {
    Logger.info(s"app is $appOpt")
    Logger.info(s"stage is $stageOpt")

    for (
      app <- appOpt;
      stage <- stageOpt
    ) {
      Logger.info(s"Tracking app metrics...$app $stage")
      Akka.system.scheduler.scheduleOnce(
        delay = 1 minute,
        receiver = Akka.system.actorOf(Props(new CloudWatchReportActor(app, stage))),
        message = ReportMetrics
      )
    }
  }


  case object ReportMetrics

  class CloudWatchReportActor(app: String, stage: String) extends Actor {

    val appDimension = new Dimension().withName("App").withValue(app)
    val stageDimension = new Dimension().withName("Stage").withValue(stage)

    override def receive = {
      case ReportMetrics => {

        val reportTime = new Date()

        val processedDatum = new MetricDatum()
          .withMetricName("messagesProcessed")
          .withDimensions(appDimension, stageDimension)
          .withValue(processedMessages.getAndSet(0).toDouble)
          .withUnit(StandardUnit.Count)
          .withTimestamp(reportTime)

        val failedDatum = new MetricDatum()
          .withMetricName("messagesFailed")
          .withDimensions(appDimension, stageDimension)
          .withValue(failedMessages.getAndSet(0).toDouble)
          .withUnit(StandardUnit.Count)
          .withTimestamp(reportTime)

        val untrackedDatum = new MetricDatum()
          .withMetricName("untrackedContentMessages")
          .withDimensions(appDimension, stageDimension)
          .withValue(untrackedContentMessages.getAndSet(0).toDouble)
          .withUnit(StandardUnit.Count)
          .withTimestamp(reportTime)

        val metricData = new PutMetricDataRequest().withNamespace("AppMetrics").withMetricData(processedDatum, failedDatum, untrackedDatum)
        cloudwatchClient.putMetricDataAsync(metricData)
        reschedule
      }
    }

    private def reschedule() {
      context.system.scheduler.scheduleOnce(1 minute, self, ReportMetrics)
    }

    override def postRestart(reason: Throwable) { reschedule }
  }
}


