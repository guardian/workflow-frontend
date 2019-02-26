package lib

import config.Config

trait AtomEditorConfig {
  val newContentUrl: String
  val viewContentUrl: String
}

object MediaAtomMakerConfig extends AtomEditorConfig {
  lazy val newContentUrl: String = Config.mediaAtomMakerUrl+ "/api/workflow/atoms"
  lazy val viewContentUrl: String = Config.mediaAtomMakerUrl + "/videos/"
}

object AtomWorkshopConfig extends AtomEditorConfig {
  lazy val newContentUrl: String = Config.atomWorkshopUrl + "/api/preview"
  lazy val viewContentUrl: String = Config.atomWorkshopUrl + "/atoms"
}
