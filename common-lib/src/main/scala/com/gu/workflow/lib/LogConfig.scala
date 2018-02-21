package lib

import java.security.SecureRandom

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.{Logger => LogbackLogger}
import com.amazonaws.auth.{InstanceProfileCredentialsProvider, STSAssumeRoleSessionCredentialsProvider}
import com.amazonaws.services.securitytoken.AWSSecurityTokenServiceClientBuilder
import com.gu.logback.appender.kinesis.KinesisAppender
import com.gu.workflow.util.{AWS, AwsInstanceTags}
import net.logstash.logback.layout.LogstashLayout
import org.slf4j.{LoggerFactory, Logger => SLFLogger}
import play.api.{Configuration, Logger => PlayLogger}

case class LogStashConf(host: String, port: Int, enabled: Boolean)

object LogConfig extends AwsInstanceTags {
  import play.api.Play.current

  val rootLogger: LogbackLogger = LoggerFactory.getLogger(SLFLogger.ROOT_LOGGER_NAME).asInstanceOf[LogbackLogger]

  val config: Configuration = play.api.Play.configuration
  val loggingPrefix = "aws.kinesis.logging"

  def init(sessionId: String) = {
    for {
      stack <- readTag("Stack")
      app <- readTag("App")
      stage <- readTag("Stage")
      stream <- config.getString(s"$loggingPrefix.streamName")
    } yield {
      val context = rootLogger.getLoggerContext
      val layout = new LogstashLayout()
      layout.setContext(context)
      layout.setCustomFields(s"""{"stack":"$stack","app":"$app","stage":"$stage", "sessionId":"$sessionId"}""")
      layout.start()

      val appender = new KinesisAppender[ILoggingEvent]()
      appender.setBufferSize(1000)
      appender.setRegion(AWS.region.getName)
      appender.setStreamName(stream)
      appender.setContext(context)
      appender.setLayout(layout)
      appender.setCredentialsProvider(buildCredentialsProvider())
      appender.start()

      rootLogger.addAppender(appender)
    }
  }

  private def buildCredentialsProvider() = {
    val stsRole = config.getString(s"$loggingPrefix.stsRoleToAssume").get

    val random = new SecureRandom()
    val sessionId = s"session${random.nextDouble()}"

    val instanceProvider = InstanceProfileCredentialsProvider.getInstance
    val stsClient = AWSSecurityTokenServiceClientBuilder.standard.withCredentials(instanceProvider).build
    new STSAssumeRoleSessionCredentialsProvider.Builder(stsRole, sessionId).withStsClient(stsClient).build
  }
}
