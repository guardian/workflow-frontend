package controllers

import play.api.mvc.{Action, Controller}
import lib.ComposerSqsReader
import org.joda.time.DateTime
import play.Logger

object Management extends Controller {

  def healthCheck = Action {
    val timeSinceLastSQSRead = lib.ComposerSqsReader.lastUpdated()
    Ok(s"OK - last read ${timeSinceLastSQSRead}")
  }

}