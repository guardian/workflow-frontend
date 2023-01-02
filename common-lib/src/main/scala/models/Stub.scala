package models

import cats.syntax.either._
import enumeratum.EnumEntry.Uppercase
import enumeratum._
import io.circe.Decoder.Result
import io.circe._
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveConfiguredDecoder, deriveConfiguredEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import org.joda.time.{DateTime, LocalDate}
import DateFormat._ // Required for serialisation / deserialisation of DateTime
import scala.collection.immutable

case class ExternalData(
                         path: Option[String] = None,
                         lastModified: Option[DateTime] = None,
                         lastModifiedBy: Option[String] = None,
                         status: Status = Status.Writers,
                         published: Option[Boolean] = None,
                         timePublished: Option[DateTime] = None,
                         revision: Option[Long] = None,
                         storyBundleId: Option[String] = None,
                         activeInInCopy: Option[Boolean] = None,
                         takenDown: Option[Boolean] = None,
                         timeTakenDown: Option[DateTime] = None,
                         wordCount: Option[Int] = None,
                         printWordCount: Option[Int] = None,
                         embargoedUntil: Option[DateTime] = None,
                         embargoedIndefinitely: Option[Boolean] = None,
                         scheduledLaunchDate: Option[DateTime] = None,
                         optimisedForWeb: Option[Boolean] = None,
                         optimisedForWebChanged: Option[Boolean] = None,
                         sensitive: Option[Boolean] = None,
                         legallySensitive: Option[Boolean] = None,
                         headline: Option[String] = None,
                         hasMainMedia: Option[Boolean] = None,
                         commentable: Option[Boolean] = None,
                         commissionedLength: Option[Int] = None,
                         actualPublicationId: Option[Long] = None,
                         actualBookId: Option[Long] = None,
                         actualBookSectionId: Option[Long] = None,
                         actualNewspaperPageNumber: Option[Int] = None,
                         actualNewspaperPublicationDate: Option[LocalDate] = None,
                         // Description enriched for use by WF front end client code.
                         shortActualPrintLocationDescription: Option[String] = None,
                         longActualPrintLocationDescription: Option[String] = None,
                         statusInPrint: Option[OctopusStatus] = None,
                         lastModifiedInPrintBy: Option[String] = None,
                         rightsSyndicationAggregate: Option[Boolean] = None,
                         rightsSubscriptionDatabases: Option[Boolean] = None,
                         rightsDeveloperCommunity: Option[Boolean] = None) {
}

object ExternalData {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[ExternalData] = deriveConfiguredEncoder
  implicit val decoder: Decoder[ExternalData] = deriveConfiguredDecoder
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
                needsPictureDesk: Flag = Flag.NA,
                note: Option[String] = None,
                prodOffice: String,
                createdAt: DateTime = DateTime.now,
                lastModified: DateTime = DateTime.now,
                trashed: Boolean = false,
                commissioningDesks: Option[String] = None,
                editorId: Option[String] = None,
                externalData: Option[ExternalData],
                plannedPublicationId: Option[Long] = None,
                plannedBookId: Option[Long] = None,
                plannedBookSectionId: Option[Long] = None,
                plannedNewspaperPageNumber: Option[Int] = None,
                plannedNewspaperPublicationDate: Option[LocalDate] = None,
                // Description enriched for use by WF front end client code.
                shortPlannedPrintLocationDescription: Option[String] = None,
                longPlannedPrintLocationDescription: Option[String] = None,
               )

object Stub {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val encoder: Encoder[Stub] = deriveConfiguredEncoder

  implicit val decoderHelper: Decoder[Stub] = new Decoder[Stub] {
    def apply(c: HCursor): Result[Stub] = {
      // This is needed because sometimes the JSON contains a nested section object
      val sectionName: String = c.downField("section").downField("name").as[String].getOrElse(c.downField("section").as[String].getOrElse(""))
      val newJson: ACursor = c.withFocus(j => j.asObject.map(_.remove("section").add("section", Json.fromString(sectionName))).map(Json.fromJsonObject).getOrElse(j))
      decode[Stub](newJson.focus.getOrElse(Json.Null).noSpaces)(decoder).fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Could not decode stub: $err while decoding the json.", c.history)), stub => Right(stub))
    }
  }

  def decoder: Decoder[Stub] = deriveConfiguredDecoder

  // This takes a flat json and converts it to a stub
  val flatJsonDecoder: Decoder[Stub] = new Decoder[Stub] {
    def apply(c: HCursor): Result[Stub] =
      c.as[ExternalData].fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Decoding the flat json - Could not decode externalData: ${err.message}.", c.history)), exData => {
        val wfLastMod: Json = c.downField("wfLastModified").focus.getOrElse(Json.Null)
        val updatedLastModCursor =
          if(wfLastMod != Json.Null) c.downField("lastModified").set(wfLastMod).up else c
        updatedLastModCursor.as[Stub].fold[Decoder.Result[Stub]](err => Left(DecodingFailure(s"Decoding the flat json - Could not decode stub: ${err.message}.", c.history)), stub => {
          Right(stub.copy(externalData = Some(exData)))
        })
      })
    }

  // This takes a stub and converts it to a flat json
  val flatJsonEncoder: Encoder[Stub] = new Encoder[Stub] {
    def apply(stub: Stub): Json = {
      (for {
        stubObj <- stub.asJson.asObject
        wfLastModified = stub.lastModified.asJson
        extDataJson <- stubObj("externalData")
        extDataObj <- extDataJson.asObject
        stubObjWithoutExData = stubObj.remove("externalData")
      } yield (
        stubObjWithoutExData.toMap
          ++ extDataObj.toMap
          ++ Map(
            "wfLastModified" -> wfLastModified
          )).asJson
      ).getOrElse(Json.Null)
    }
  }
}

sealed trait Flag extends EnumEntry with Uppercase
case object Flag extends Enum[Flag] with CirceEnum[Flag] {
  case object NA extends Flag
  case object Required extends Flag
  case object Complete extends Flag

  val values: immutable.IndexedSeq[Flag] = findValues
}
