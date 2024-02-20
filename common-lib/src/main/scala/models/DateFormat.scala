package models

import io.circe.syntax._
import io.circe._
import org.joda.time.format.ISODateTimeFormat
import org.joda.time.{DateTime, DateTimeZone, LocalDate}

object DateFormat {
  private val formatter = ISODateTimeFormat.dateTime()

  implicit val dateTimeEncoder: Encoder[DateTime] = new Encoder[DateTime] {
    def apply(d: DateTime): Json = {
      val utc = d.withZone(DateTimeZone.UTC)
      formatter.print(utc).asJson
    }
  }
  implicit val dateTimeDecoder: Decoder[DateTime] = new Decoder[DateTime] {
    def apply(c: HCursor): Decoder.Result[DateTime] = {
      val dateTime = for {
        value <- c.focus
        string <- value.asString
      } yield new DateTime(string)
      dateTime.fold[Decoder.Result[DateTime]](Left(DecodingFailure("could not decode date", c.history)))(dt => Right(dt))
    }
  }
  implicit val localDateStartOfDayEncoder: Encoder[LocalDate] = new Encoder[LocalDate] {
    def apply(d: LocalDate): Json = {
      val utc = d.toDateTimeAtStartOfDay(DateTimeZone.UTC).withZone(DateTimeZone.UTC)
      formatter.print(utc).asJson
    }
  }
  implicit val localDateDecoder: Decoder[LocalDate] = new Decoder[LocalDate] {
    def apply(c: HCursor): Decoder.Result[LocalDate] = {
      val dateTime = for {
        value <- c.focus
        string <- value.asString
      } yield new LocalDate(new DateTime(string))
      dateTime.fold[Decoder.Result[LocalDate]](Left(DecodingFailure("could not decode date", c.history)))(dt => Right(dt))
    }
  }

}
