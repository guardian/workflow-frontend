import akka.actor.Props
import play.api.libs.concurrent.Akka
import play.api.mvc.WithFilters
import play.api.{GlobalSettings, Application}
import lib.{RedirectToHTTPSFilter, SqsReader, ComposerSqsReader}


object Global extends WithFilters(RedirectToHTTPSFilter) with GlobalSettings {
  override def onStart(app: Application) {

    import play.api.Play.current
    import play.api.libs.concurrent.Execution.Implicits._
    import scala.concurrent.duration._
    Akka.system.scheduler.schedule(
      initialDelay = 0.seconds,
      interval = 3.seconds,
      receiver = Akka.system.actorOf(Props[ComposerSqsReader]),
      message = SqsReader
    )
  }

}
