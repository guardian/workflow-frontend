package lib

import java.io.File

import ch.qos.logback.classic.{Logger => LogbackLogger, LoggerContext}
import ch.qos.logback.core.util.Duration
import play.api.Logger
import play.api.{Logger => PlayLogger, LoggerLike}
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.{FileAppender, ConsoleAppender}
import net.logstash.logback.encoder.LogstashEncoder
import net.logstash.logback.appender.LogstashTcpSocketAppender
import org.slf4j.{Logger => SLFLogger, LoggerFactory}

case class LogStashConf(host: String, port: Int, enabled: Boolean)

object LogConfig {

  val rootLogger = LoggerFactory.getLogger(SLFLogger.ROOT_LOGGER_NAME).asInstanceOf[LogbackLogger]
  lazy val loggingContext = LoggerFactory.getILoggerFactory.asInstanceOf[LoggerContext]

  import play.api.Play.current
  val config = play.api.Play.configuration

  lazy val customFields = (
    for {
      app   <- config.getString("logging.fields.app")
      stage <- config.getString("logging.fields.stage")
    } yield Map(
      "stack" -> "workflow",
      "stage" -> stage.toUpperCase,
      "app"   -> app
    )
  ).getOrElse(Map("logging-error" -> "bad-logging-config"))

  def makeCustomFields: String = {
    "{" + (for((k, v) <- customFields) yield(s""""${k}":"${v}"""")).mkString(",") + "}"
  }

  def asLogBack(l: LoggerLike): Option[LogbackLogger] = l.logger match {
    case l: LogbackLogger => Some(l)
    case _ => None
  }

  def makeEncoder(context: LoggerContext) = {
    val e = new LogstashEncoder()
    e.setContext(context)
    e.setCustomFields(makeCustomFields)
    e.start()
    e
  }

  def makeTcpAppender(context: LoggerContext, host: String, port: Int) = {
    val a = new LogstashTcpSocketAppender()
    a.setContext(context)
    a.setEncoder(makeEncoder(context))
    a.setKeepAliveDuration(Duration.buildBySeconds(30.0))
    a.addDestination(s"$host:$port")
    a.start()
    a
  }


  def init(conf: LogStashConf) = {
    if(conf.enabled) {
      PlayLogger.info("LogConfig initializing")
      asLogBack(PlayLogger).map { lb =>
        lb.info("Configuring Logback")
        val context = lb.getLoggerContext
        // remove the default configuration
        lb.addAppender(makeTcpAppender(context, conf.host, conf.port))
        lb.info("Configured Logback")
      } getOrElse( Logger.info("not running using logback") )
    } else {
      PlayLogger.info("Logging disabled")
    }
  }
}
