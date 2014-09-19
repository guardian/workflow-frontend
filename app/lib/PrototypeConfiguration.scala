package lib

import com.gu.workflow.lib.Config
import play.Logger

case class PrototypeConfiguration(composerUrl: String, googleClientId: String, googleClientSecret: String, host: String, presenceUrl: String)

object PrototypeConfiguration {

  def apply: PrototypeConfiguration = {
      val configEit = (for {
        composerUrl <- Config.getConfigString("composer.url").right
        googleClientId <- Config.getConfigString("google.clientId").right
        googleClientSecret <- Config.getConfigString("google.clientSecret").right
        host <- Config.getConfigString("host").right
        appSecret <- Config.getConfigString("application.secret").right
        presenceUrl <- Config.getConfigString("presence.url").right
      } yield PrototypeConfiguration(composerUrl, googleClientId, googleClientSecret, host, presenceUrl))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prototype Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
