import java.util.TimeZone
import play.api.libs.concurrent.Akka
import play.api.mvc.WithFilters
import play.api.{Logger, GlobalSettings, Application}
import lib.{SyncComposer, ComposerQuery, PrototypeConfiguration, RedirectToHTTPSFilter, ContentId}
import scala.concurrent.duration._
import akka.actor.Props
import scala.concurrent.ExecutionContext.Implicits.global

object Global extends WithFilters(RedirectToHTTPSFilter) with GlobalSettings {

  override def beforeStart(app: Application) {

    /* It's horrible, but this is absolutely necessary for correct interpretation
     * of datetime columns in the database which do not have a timezone.
     * The JDBC driver interprets these using the JVM's default timezone which is
     * almost certainly what no sane person ever wants to do.
     */

    System.setProperty("user.timezone", "UTC")
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))

    //throw an exception if required config is not all there
    PrototypeConfiguration.apply
    Logger.info("successfully loaded configuration variables")
  }

}
