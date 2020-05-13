import config.Config
import lib.{LogConfig, LoggingFilter, RedirectToHTTPSFilter}
import play.api.mvc.WithFilters
import play.api.{Application, GlobalSettings}
import play.filters.gzip.GzipFilter

object Global extends WithFilters(RedirectToHTTPSFilter, new GzipFilter, LoggingFilter) with GlobalSettings {
  override def beforeStart(app: Application) {
    if (Config.isDev && Config.localLogShipping) {
      LogConfig.initLocalLogShipping(Config.sessionId)
    }
    LogConfig.init(Config.sessionId)
  }
}
