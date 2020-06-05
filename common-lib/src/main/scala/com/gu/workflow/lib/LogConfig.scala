package lib

import java.net.InetSocketAddress
import java.security.SecureRandom

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.{Logger => LogbackLogger}
import com.amazonaws.auth.{InstanceProfileCredentialsProvider, STSAssumeRoleSessionCredentialsProvider}
import com.amazonaws.services.securitytoken.AWSSecurityTokenServiceClientBuilder
import com.gu.logback.appender.kinesis.KinesisAppender
import com.gu.workflow.util.{AWS, AwsInstanceTags}
import net.logstash.logback.appender.LogstashTcpSocketAppender
import net.logstash.logback.encoder.LogstashEncoder
import net.logstash.logback.layout.LogstashLayout
import org.slf4j.{LoggerFactory, Logger => SLFLogger}
import play.api.libs.json.Json

import scala.util.Try

object LogConfig extends AwsInstanceTags {

  val rootLogger: LogbackLogger = LoggerFactory.getLogger(SLFLogger.ROOT_LOGGER_NAME).asInstanceOf[LogbackLogger]

  private val BUFFER_SIZE = 1000

  private def createCustomFields(stack: String, stage: String, app: String, sessionId: String): String = Json.toJson(Map(
    "stack" -> stack,
    "stage" -> stage,
    "app" -> app,
    "sessionId" -> sessionId
  )).toString()

  private def createLogstashAppender(sessionId: String): LogstashTcpSocketAppender = {
    val customFields = createCustomFields("workflow", "DEV", "workflow-frontend", sessionId)

    val appender = new LogstashTcpSocketAppender()
    appender.setContext(rootLogger.getLoggerContext)
    appender.addDestinations(new InetSocketAddress("localhost", 5000))
    appender.setWriteBufferSize(BUFFER_SIZE)

    val encoder = new LogstashEncoder()
    encoder.setCustomFields(customFields)
    appender.setEncoder(encoder)

    encoder.start()
    appender.start()

    appender
  }

  def initLocalLogShipping(sessionId: String) = {
    Try {
      rootLogger.info("Configuring local logstash log shipping")
      rootLogger.addAppender(createLogstashAppender(sessionId))
      rootLogger.info("Local logstash log shipping configured")
    } recover {
      case e => rootLogger.error("Local logstash log shipping failed", e)
    }
  }

  def init(sessionId: String, streamName: String, stsRole: String) = {
    Try {
      for {
        stack <- readTag("Stack")
        app <- readTag("App")
        stage <- readTag("Stage")
      } yield {
        val customFields = createCustomFields(stack, stage, app, sessionId)
        val context = rootLogger.getLoggerContext
        val layout = new LogstashLayout()
        layout.setContext(context)
        layout.setCustomFields(customFields)
        layout.start()

        val appender = new KinesisAppender[ILoggingEvent]()
        appender.setBufferSize(BUFFER_SIZE)
        appender.setRegion(AWS.region.getName)
        appender.setStreamName(streamName)
        appender.setContext(context)
        appender.setLayout(layout)
        appender.setRoleToAssumeArn(stsRole)
        appender.setCredentialsProvider(buildCredentialsProvider(stsRole))
        appender.start()

        rootLogger.addAppender(appender)
        rootLogger.info("Configured Logback")
      }
    } recover {
      case e => rootLogger.error("LogConfig Failed!", e)
    }
  }

  private def buildCredentialsProvider(stsRole: String) = {
    val random = new SecureRandom()
    val sessionId = s"session${random.nextDouble()}"

    val instanceProvider = InstanceProfileCredentialsProvider.getInstance
    val stsClient = AWSSecurityTokenServiceClientBuilder.standard.withCredentials(instanceProvider).build
    new STSAssumeRoleSessionCredentialsProvider.Builder(stsRole, sessionId).withStsClient(stsClient).build
  }
}
