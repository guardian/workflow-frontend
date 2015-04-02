package lib

import com.gu.workflow.lib.Config
import play.Logger

case class PrototypeConfiguration(
                                   composerUrl: String,
                                   googleClientId: String,
                                   googleClientSecret: String,
                                   host: String,
                                   presenceUrl: String,
                                   presenceClientLib: String,
                                   preferencesUrl: String,
                                   incopyExportUrl: String,
                                   logStashConf: LogStashConf
                                   )

object PrototypeConfiguration {


  implicit val defaultExecutionContext =
    scala.concurrent.ExecutionContext.Implicits.global

  lazy val cached = apply

  def apply: PrototypeConfiguration = {
      val configEit = (for {
        composerUrl <- Config.getConfigString("composer.url").right
        googleClientId <- Config.getConfigString("google.clientId").right
        googleClientSecret <- Config.getConfigString("google.clientSecret").right
        host <- Config.getConfigString("host").right
        appSecret <- Config.getConfigString("application.secret").right
        presenceUrl <- Config.getConfigString("presence.url").right
        presenceClientLib <- Config.getConfigString("presence.clientLib").right
        preferencesUrl <- Config.getConfigString("preferences.url").right
        incopyExportUrl <- Config.getConfigString("incopyExportUrl").right
        logStashHost <- Config.getConfigString("logging.logstash.host").right
        logStashPort <- Config.getConfigInt("logging.logstash.port").right
        logStashEnabled <- Config.getConfigBoolean("logging.logstash.enabled").right
      } yield PrototypeConfiguration(composerUrl, googleClientId, googleClientSecret, host, presenceUrl, presenceClientLib, preferencesUrl, incopyExportUrl, LogStashConf(logStashHost, logStashPort, logStashEnabled)))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prototype Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
