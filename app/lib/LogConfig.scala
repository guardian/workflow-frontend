package lib

import play.api.{Logger, LoggerLike}
import ch.qos.logback.classic.{Logger => LogbackLogger, LoggerContext}
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.ConsoleAppender
import net.logstash.logback.encoder.LogstashEncoder
import net.logstash.logback.appender.LogstashTcpSocketAppender

object LogConfig {

  import play.api.Play.current
  val config = play.api.Play.configuration

  lazy val customFields = (
    for {
      app   <- config.getString("logging.fields.app")
      stage <- config.getString("logging.fields.stage")
    } yield Map(
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

  def makeTcpAppender(context: LoggerContext) = {
    val a = new LogstashTcpSocketAppender()
    a.setContext(context)
    a.setEncoder(makeEncoder(context))
    a.setRemoteHost(PrototypeConfiguration.apply.logStashConf.host)
    a.setPort(PrototypeConfiguration.apply.logStashConf.port)
    a.start()
    a
  }

  def init = {
    Logger.info("LogConfig INIT()")
    asLogBack(Logger).map { lb =>
      lb.info("Configuring Logback")
      val context = lb.getLoggerContext
      // remove the default configuration
      lb.addAppender(makeTcpAppender(context))
      lb.info("Configured Logback")
    } getOrElse( Logger.info("not running using logback") )
  }
}
