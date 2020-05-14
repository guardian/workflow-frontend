import config.Config
import lib.{LogConfig, LoggingFilter}
import play.api.mvc.WithFilters
import play.api.{Application, GlobalSettings}
import play.filters.gzip.GzipFilter

object Global extends WithFilters(new GzipFilter, LoggingFilter) with GlobalSettings {
  override def beforeStart(app: Application) {

    LogConfig.init(Config.sessionId)
  }
}
