package controllers

import play.api.mvc.{Action, Controller}
import lib.ComposerSqsReader
import org.joda.time.DateTime
import play.Logger

object Management extends Controller {

  def healthCheck = Action {
    val timeSinceLastSQSRead = lib.ComposerSqsReader.lastUpdated()

    if(timeSinceLastSQSRead.forall(dt => dt.isBefore(new DateTime().minusSeconds(20)))) {
      Logger.info(s"Failing health check, last successful read ${timeSinceLastSQSRead}")
      ServiceUnavailable(s"Health check fail - last successful read ${timeSinceLastSQSRead}")
    }
    else {
      Logger.info(s"Healthcheck ok, last successful read ${timeSinceLastSQSRead}")
      Ok(s"OK - last read ${timeSinceLastSQSRead}")
    }
  }

}