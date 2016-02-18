package lib

import com.gu.workflow.lib.Config
import play.Logger

case class PrototypeConfiguration(
                                   googleClientId: String,
                                   googleClientSecret: String
)

object PrototypeConfiguration {

  lazy val cached = apply

  def apply: PrototypeConfiguration = {
      val configEit = (for {
        googleClientId <- Config.getConfigString("google.clientId").right
        googleClientSecret <- Config.getConfigString("google.clientSecret").right
      } yield PrototypeConfiguration(googleClientId, googleClientSecret))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prototype Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
