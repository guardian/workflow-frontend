import config.Config
import lib.{LogConfig, LoggingFilter, RedirectToHTTPSFilter}
import play.api.mvc.WithFilters
import play.api.{Application, GlobalSettings}
import play.filters.gzip.GzipFilter

object Global extends WithFilters(RedirectToHTTPSFilter, new GzipFilter, LoggingFilter) with GlobalSettings {
  override def beforeStart(app: Application) {

    LogConfig.init(Config.sessionId)
  }
}
