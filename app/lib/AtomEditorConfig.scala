package lib

import config.Config

trait AtomEditorConfig {
  val newContentUrl: String
  val viewContentUrl: String
}

object MediaAtomMakerConfig extends AtomEditorConfig {
  lazy val newContentUrl: String = Config.editorialToolsConfig.mediaAtomMakerUrl.toString + "/api/workflow/atoms"
  lazy val viewContentUrl: String = Config.editorialToolsConfig.mediaAtomMakerUrl.toString + "/videos/"
}

object AtomWorkshopConfig extends AtomEditorConfig {
  lazy val newContentUrl: String = Config.editorialToolsConfig.atomWorkshopUrl.toString + "/api/preview"
  lazy val viewContentUrl: String = Config.editorialToolsConfig.atomWorkshopUrl.toString + "/atoms"
}
