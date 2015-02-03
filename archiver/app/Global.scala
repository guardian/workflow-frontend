import akka.actor.Props
import play.api.libs.concurrent.Akka
import play.api.{Application, GlobalSettings, Logger}

object Global extends GlobalSettings {

  override def onStart(app: Application) = {
    Logger.info("starting archiver")

    import play.api.Play.current
    import play.api.libs.concurrent.Execution.Implicits._
    import scala.concurrent.duration._

    //todo - figure out how to make this a specific time
    Akka.system.scheduler.scheduleOnce(
      delay = 0.seconds,
      receiver = Akka.system.actorOf(Props[Archiver]),
      message = Archive
    )
  }

}
