import com.gu.workflow.lib.Config
import config.Config
import lib.LogConfig
import play.api.{Application, ApplicationLoader, LoggerConfigurator}

import scala.concurrent.Future

class AppLoader extends ApplicationLoader {
  override def load(context: ApplicationLoader.Context): Application = {
    LoggerConfigurator(context.environment.classLoader)
      .foreach(_.configure(context.environment))

    val config = new Config(context.initialConfiguration)

    if (config.isDev && config.localLogShipping) {
      LogConfig.initLocalLogShipping(config.sessionId)
    }
    LogConfig.init(config.sessionId)
  }
}
