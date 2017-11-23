package models

import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor}
import org.joda.time.DateTime

object DateFormat {
  private val datePattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"

  implicit val dateTimeEncoder = new Encoder[DateTime] {
    def apply(d: DateTime) = d.toString(datePattern).asJson
  }
  implicit val dateTimeDecoder = new Decoder[DateTime] {
    def apply(c: HCursor): Decoder.Result[DateTime] = {
      val dateTime = for {
        value <- c.focus
        string <- value.asString
      } yield new DateTime(string)
      dateTime.fold[Decoder.Result[DateTime]](Left(DecodingFailure("could not decode date", c.history)))(dt => Right(dt))
    }
  }
}
