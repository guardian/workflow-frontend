import config.Config
import lib.LogConfig
import play.api.{Application, ApplicationLoader, LoggerConfigurator}

class AppLoader extends ApplicationLoader {
  override def load(context: ApplicationLoader.Context): Application = {
    LoggerConfigurator(context.environment.classLoader)
      .foreach(_.configure(context.environment))

    val config = new Config(context.initialConfiguration)

    if (config.isDev && config.localLogShipping) {
      LogConfig.initLocalLogShipping(config.sessionId)
    }

    (config.loggingStreamName, config.loggingRole) match {
      case (Some(streamName), Some(role)) => LogConfig.init(config.sessionId, streamName, role)
      case _ =>
    }

    new AppComponents(context).application
  }
}
