package lib

import config.Config

case class ComposerConfig(
  baseUrl: String,
  newContentUrl: String,
  adminUrl: String,
  contentDetails: String,
  templates: String
)

object ComposerConfig {
  def apply(config: Config): ComposerConfig = ComposerConfig(
    baseUrl = config.composerUrl,
    newContentUrl = s"${config.composerUrl}/api/content",
    adminUrl = s"${config.composerUrl}/content",
    contentDetails = s"${config.composerUrl}/api/content/",
    templates = s"${config.composerUrl}/api/templates",
  )
}
