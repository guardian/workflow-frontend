package lib

import org.joda.time.DateTime
import org.joda.time.format.{DateTimeFormat, ISODateTimeFormat}

object Formatting {

  def parseDate(dateString: String): Option[DateTime] =
    try { Some(ISODateTimeFormat.dateTimeNoMillis.parseDateTime(dateString)) }
    catch {
      case e: IllegalArgumentException => None
    }

  val displayPattern:  String = "d MMM HH:mm"

  def displayDate(date: DateTime) = DateTimeFormat.forPattern(displayPattern).print(date)

}
