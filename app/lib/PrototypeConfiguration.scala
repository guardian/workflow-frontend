package lib

import play.Logger

case class PrototypeConfiguration(composerUrl: String, googleClientId: String, googleClientSecret: String, host: String)

object PrototypeConfiguration {
  import play.api.Play.current
  val config = play.api.Play.configuration

  def getConfigString(name: String): Either[String, String] = {
    config.getString(name) match {
      case Some(value) => Right(value)
      case None => Left(s"could not find ${name}")
    }
  }

  def apply: PrototypeConfiguration = {
      val configEit = (for {
        composerUrl <- getConfigString("composer.url").right
        googleClientId <- getConfigString("google.clientId").right
        googleClientSecret <- getConfigString("google.clientSecret").right
        host <- getConfigString("host").right
      } yield PrototypeConfiguration(composerUrl, googleClientId, googleClientSecret, host))
    configEit.fold(error => {
      Logger.error(s"could not instantiate Prototype Configuration ${error}")
      sys.error(error)
    }, config => config)
  }
}
