import config.Config
import lib.LogConfig
import org.slf4j.{LoggerFactory, Logger => SLFLogger}
import ch.qos.logback.classic.{Logger => LogbackLogger}
import play.api.{Application, ApplicationLoader, LoggerConfigurator}

class AppLoader extends ApplicationLoader {
  override def load(context: ApplicationLoader.Context): Application = {
    LoggerConfigurator(context.environment.classLoader)
      .foreach(_.configure(context.environment))

    val config = new Config(context.initialConfiguration)

    if (config.isDev && config.localLogShipping) {
      LogConfig.initLocalLogShipping(config.sessionId)
    }

    val rootLogger: LogbackLogger = LoggerFactory.getLogger(SLFLogger.ROOT_LOGGER_NAME).asInstanceOf[LogbackLogger]

    (config.loggingStreamName, config.loggingRole) match {
      case (Some(streamName), Some(role)) => {
        rootLogger.info(s"Got stream: $streamName and role: $role, initialising logs")
        LogConfig.init(config.sessionId, streamName, role)
      }
      case _ => {
        rootLogger.info(s"Not enough info to init logs! Got stream: ${config.loggingStreamName} and config: ${config.loggingRole}")
      }
    }

    new AppComponents(context).application
  }
}
