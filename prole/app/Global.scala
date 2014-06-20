import akka.actor.Props
import java.util.TimeZone
import lib.{SqsReader, ComposerSqsReader}
import play.api.libs.concurrent.Akka
import play.api.{Application, GlobalSettings, Logger}

object Global extends GlobalSettings {

  override def beforeStart(app: Application) {

    /* It's horrible, but this is absolutely necessary for correct interpretation
     * of datetime columns in the database which do not have a timezone.
     * The JDBC driver interprets these using the JVM's default timezone which is
     * almost certainly what no sane person ever wants to do.
     */

    System.setProperty("user.timezone", "UTC")
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
  }

  override def onStart(app: Application) {

    import play.api.Play.current
    import play.api.libs.concurrent.Execution.Implicits._
    import scala.concurrent.duration._

    Logger.info("Consuming notifications...")
    Akka.system.scheduler.schedule(
      initialDelay = 0.seconds,
      interval = 3.seconds,
      receiver = Akka.system.actorOf(Props[ComposerSqsReader]),
      message = SqsReader
    )

    // prod this to make it load initial state.
    //SectionDatabase.sectionList
  }
}