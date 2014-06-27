package lib

import com.gu.workflow.lib.Config
import play.Logger

case class PrototypeConfiguration(composerUrl: String, googleClientId: String, googleClientSecret: String, host: String)

object PrototypeConfiguration {

  def apply: PrototypeConfiguration = {
      val configEit = (for {
        composerUrl <- Config.getConfigString("composer.url").right
        googleClientId <- Config.getConfigString("google.clientId").right
        googleClientSecret <- Config.getConfigString("google.clientSecret").right
        host <- Config.getConfigString("host").right
      } yield PrototypeConfiguration(composerUrl, googleClientId, googleClientSecret, host))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prototype Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
