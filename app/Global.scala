import config.Config
import lib.{LogConfig, LoggingFilter}
import play.api.mvc.WithFilters
import play.api.{Application, GlobalSettings}
import play.filters.gzip.GzipFilter

object Global extends WithFilters(new GzipFilter, LoggingFilter) with GlobalSettings {
  override def beforeStart(app: Application) {
    if (Config.isDev && Config.localLogShipping) {
      LogConfig.initLocalLogShipping(Config.sessionId)
    }
    LogConfig.init(Config.sessionId)
  }
}
