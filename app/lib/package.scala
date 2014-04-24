import org.joda.time.DateTime
import org.joda.time.format.{DateTimeFormat, ISODateTimeFormat}

package object Formatting {

  def parseDate(dateString: String): Option[DateTime] =
    try { Some(ISODateTimeFormat.dateTimeParser().parseDateTime(dateString)) }
  catch {
    case e: IllegalArgumentException => None
  }
  val displayPattern:  String = "HH:mm d MMM"

  def displayDate(date: DateTime) = DateTimeFormat.forPattern(displayPattern).print(date)

}
