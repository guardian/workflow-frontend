package lib

import play.api.{Logger, LoggerLike}
import ch.qos.logback.classic.{Logger => LogbackLogger, LoggerContext}
import net.logstash.logback.encoder.LogstashEncoder
import net.logstash.logback.appender.LogstashTcpSocketAppender

object LogConfig {

  def asLogBack(l: LoggerLike): Option[LogbackLogger] = l.logger match {
    case l: LogbackLogger => Some(l)
    case _ => None
  }

  def makeEncoder(context: LoggerContext) = {
    val e = new LogstashEncoder()
    e.setContext(context)
    e.setCustomFields("""{"appname":"pmr-test"}""")
    e.start()
    e
  }

  def makeAppender(context: LoggerContext) = {
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
      context.reset()
      lb.addAppender(makeAppender(context))
      lb.info("Configured Logback")
    } getOrElse( Logger.info("not running using logback") )
  }
}
