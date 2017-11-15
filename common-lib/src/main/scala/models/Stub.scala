package models

import cats.syntax.either._
import enumeratum.EnumEntry.Uppercase
import enumeratum._
import io.circe.Decoder.Result
import io.circe._
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import models.DateFormat._
import org.joda.time.DateTime

case class ExternalData(
                         path: Option[String] = None,
                         lastModified: Option[DateTime] = None,
                         status: Status = Status.Writers,
                         published: Option[Boolean] = None,
                         timePublished: Option[DateTime] = None,
                         revision: Option[Long] = None,
                         storyBundleId: Option[String] = None,
                         activeInInCopy: Option[Boolean] = None,
                         takenDown: Option[Boolean] = None,
                         timeTakenDown: Option[DateTime] = None,
                         wordCount: Option[Int] = None,
                         embargoedUntil: Option[DateTime] = None,
                         embargoedIndefinitely: Option[Boolean] = None,
                         scheduledLaunchDate: Option[DateTime] = None,
                         optimisedForWeb: Option[Boolean] = None,
                         optimisedForWebChanged: Option[Boolean] = None,
                         sensitive: Option[Boolean] = None,
                         legallySensitive: Option[Boolean] = None,
                         headline: Option[String] = None,
                         hasMainMedia: Option[Boolean] = None,
                         commentable: Option[Boolean] = None)

object ExternalData {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[ExternalData] = deriveEncoder
  implicit val decoder: Decoder[ExternalData] = deriveDecoder
}

case class Stub(id: Option[Long] = None,
               title: String,
               section: String,
               due: Option[DateTime] = None,
               assignee: Option[String] = None,
               assigneeEmail: Option[String] = None,
               composerId: Option[String] = None,
               contentType: String,
               priority: Int = 0,
               needsLegal: Flag = Flag.NA,
               note: Option[String] = None,
               prodOffice: String,
               createdAt: DateTime = DateTime.now(),
               lastModified: DateTime = DateTime.now(),
               trashed: Boolean = false,
               commissioningDesks: Option[String] = None,
               editorId: Option[String] = None,
               externalData: Option[ExternalData])

object Stub {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val encoder: Encoder[Stub] = deriveEncoder

  implicit val decoderHelper: Decoder[Stub] = new Decoder[Stub] {
    def apply(c: HCursor): Result[Stub] = {
      val sectionName: String = c.downField("section").downField("name").as[String].getOrElse(c.downField("section").as[String].getOrElse(""))
      val newJson: ACursor = c.withFocus(j => j.asObject.map(_.remove("section").add("section", Json.fromString(sectionName))).map(Json.fromJsonObject).getOrElse(j))
      decode[Stub](newJson.focus.getOrElse(Json.Null).noSpaces)(decoder).fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Could not decode stub: $err while decoding the json.", c.history)), stub => Right(stub))
    }
  }

  val decoder: Decoder[Stub] = deriveDecoder

  // This takes a flat json and converts it to a stub
  val flatJsonDecoder: Decoder[Stub] = new Decoder[Stub] {
    def apply(c: HCursor): Result[Stub] =
      c.as[Stub].fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Could not decode stub: ${err.message} while decoding the flat json.", c.history)), stub =>
        c.as[ExternalData].fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Could not decode externalData: ${err.message} while decoding the flat json.", c.history)), exData =>
          Right(stub.copy(externalData = Some(exData)))
        )
      )
  }

  // This takes a stub and converts it to a flat json
  val flatJsonEncoder: Encoder[Stub] = new Encoder[Stub] {
    def apply(stub: Stub): Json = {
      val stubJson = stub.asJson
      (for {
        stubObj <- stubJson.asObject
        extDataJson <- stubObj("externalData")
        extDataObj <- extDataJson.asObject
        stubObjWithoutExData = stubObj.remove("externalData")
      } yield (stubObjWithoutExData.toMap ++ extDataObj.toMap).asJson).getOrElse(Json.Null)
    }
  }
}

sealed trait Flag extends EnumEntry with Uppercase
case object Flag extends Enum[Flag] with CirceEnum[Flag] {
  case object NA extends Flag
  case object Required extends Flag
  case object Complete extends Flag

  val values = findValues
}
