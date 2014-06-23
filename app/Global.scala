import java.util.TimeZone
import play.api.mvc.WithFilters
import play.api.{GlobalSettings, Application}
import lib.RedirectToHTTPSFilter


object Global extends WithFilters(RedirectToHTTPSFilter) with GlobalSettings {

  override def beforeStart(app: Application) {

    /* It's horrible, but this is absolutely necessary for correct interpretation
     * of datetime columns in the database which do not have a timezone.
     * The JDBC driver interprets these using the JVM's default timezone which is
     * almost certainly what no sane person ever wants to do.
     */

    System.setProperty("user.timezone", "UTC")
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
  }

}
