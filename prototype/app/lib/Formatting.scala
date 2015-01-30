package lib

import org.joda.time.DateTime
import org.joda.time.format.{DateTimeFormat, ISODateTimeFormat}

object Formatting {

  /**
   * Parses a date from a string in ISO8601 format. Relaxed parsing whereby
   * milliseconds, seconds, time can be omitted.
   *
   * @throws IllegalArgumentException when dateString cannot be parsed in ISO8601 format.
   */
  def parseDate(dateString: String): Option[DateTime] = dateString match {
    case "" => None
    case _ => Some(ISODateTimeFormat.dateTimeParser.parseDateTime(dateString))
  }


  val displayPattern:  String = "d MMM HH:mm"

  def displayDate(date: DateTime) = DateTimeFormat.forPattern(displayPattern).print(date)

}
