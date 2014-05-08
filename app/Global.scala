import akka.actor.Props
import play.api.libs.concurrent.Akka
import play.api.{GlobalSettings, Application}
import lib.{SqsReader, ComposerSqsReader}

object Global extends GlobalSettings {
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
