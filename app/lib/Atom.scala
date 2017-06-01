package lib

import config.Config

object Atom {
  lazy val mediaAtomMakerBaseUrl: String = Config.mediaAtomMakerUrl
  lazy val newContentUrl: String = mediaAtomMakerBaseUrl + "/api2/workflow/atoms"
  lazy val viewContentUrl: String = mediaAtomMakerBaseUrl + "/videos/"
}
