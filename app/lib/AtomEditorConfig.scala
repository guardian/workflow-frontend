package lib

import config.Config

trait AtomEditorConfig {
  val newContentUrl: String
  val viewContentUrl: String
}

case class MediaAtomMakerConfig(
  override val newContentUrl: String,
  override val viewContentUrl: String
) extends AtomEditorConfig

object MediaAtomMakerConfig {
  def apply(config: Config): MediaAtomMakerConfig = {
    MediaAtomMakerConfig(
      newContentUrl = s"${config.mediaAtomMakerUrl}/api/workflow/atoms",
      viewContentUrl = s"${config.mediaAtomMakerUrl}/videos/",
    )
  }
}

case class AtomWorkshopConfig(
  override val newContentUrl: String,
  override val viewContentUrl: String
) extends AtomEditorConfig

object AtomWorkshopConfig {
  def apply(config: Config): MediaAtomMakerConfig = {
    MediaAtomMakerConfig(
      newContentUrl = s"${config.atomWorkshopUrl}/api/preview",
      viewContentUrl = s"${config.atomWorkshopUrl}/atoms",
    )
  }
}
