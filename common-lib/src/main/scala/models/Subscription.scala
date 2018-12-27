package models

import java.nio.charset.StandardCharsets

import com.amazonaws.services.dynamodbv2.document.Item
import com.google.common.hash.Hashing
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import io.circe.{Decoder, Encoder, ObjectEncoder}
import play.api.data.Forms._
import play.api.data._

// These are the details provided by the browser as registered to the service worker
case class SubscriptionKeys(p256dh: String, auth: String)
case class SubscriptionEndpoint(endpoint: String, keys: SubscriptionKeys)

case class Subscription(email: String, userAgent: String, query: SubscriptionQuery, endpoint: SubscriptionEndpoint, schedule: SubscriptionSchedule)

sealed trait SubscriptionQuery
// seenIds is optional as it encodes three states:
//   None            -> we have not seen any content under the given query yet so don't fire notifications
//   Some(Map.empty) -> we last saw no content matching the query
//   Some(content)   -> the content we saw last and the status it was in (ie do a diff and fire notifications)
case class WorkflowQuery(query: Map[String, Seq[String]], seenIds: Option[Map[Long, Status]]) extends SubscriptionQuery
case class PhraseQuery(word: String, seenInContent: Map[String, Long]) extends SubscriptionQuery

case class SubscriptionSchedule(enabled: Boolean)

// The actual contents of a notification fired and sent to the service worker to actually display on the users machine
case class SubscriptionUpdate(title: String, body: String, url: Option[String])

object Subscription {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val keysEncoder: Encoder[SubscriptionKeys] = deriveEncoder
  implicit val keysDecoder: Decoder[SubscriptionKeys] = deriveDecoder

  implicit val endpointEncoder: Encoder[SubscriptionEndpoint] = deriveEncoder
  implicit val endpointDecoder: Decoder[SubscriptionEndpoint] = deriveDecoder

  implicit val scheduleEncoder: Encoder[SubscriptionSchedule] = deriveEncoder
  implicit val scheduleDecoder: Decoder[SubscriptionSchedule] = deriveDecoder

  implicit val updateEncoder: Encoder[SubscriptionUpdate] = deriveEncoder
  implicit val updateDecoder: Decoder[SubscriptionUpdate] = deriveDecoder

  implicit val workflowQueryEncoder: ObjectEncoder[WorkflowQuery] = deriveEncoder
  implicit val workflowQueryDecoder: Decoder[WorkflowQuery] = deriveDecoder

  implicit val wordQueryEncoder: ObjectEncoder[PhraseQuery] = deriveEncoder
  implicit val wordQueryDecoder: Decoder[PhraseQuery] = deriveDecoder

  implicit val subscriptionQueryEncoder: ObjectEncoder[SubscriptionQuery] = ObjectEncoder.instance {
    case q: WorkflowQuery => q.asJsonObject.add("type", "workflow".asJson)
    case q: PhraseQuery => q.asJsonObject.add("type", "phrase".asJson)
  }

  implicit val subscriptionQueryDecoder: Decoder[SubscriptionQuery] = for {
    tpe <- Decoder[String].prepare(_.downField("type"))
    ret <- tpe match {
      case "workflow" => Decoder[WorkflowQuery]
      case "phrase" => Decoder[PhraseQuery]
      case other => Decoder.failedWithMessage(s"Invalid query type $other")
    }
  } yield ret

  implicit val encoder: Encoder[Subscription] = deriveEncoder
  implicit val decoder: Decoder[Subscription] = deriveDecoder

  val form = Form(
    tuple(
      "id" -> text,
      "enabled" -> boolean,
      "delete" -> optional(boolean)
    )
  )

  def id(sub: Subscription): String = {
    val hasher = Hashing.md5().newHasher()

    val params = sub.query match {
      case WorkflowQuery(q, _) => q.toList.flatMap { case(k, v) => v.map(k -> _) }
      case PhraseQuery(w, _) => List(w -> w)
    }

    // Sort for stable iteration order to ensure consistent hash
    params.sorted.foreach { case(k, v) =>
      hasher.putString(k, StandardCharsets.UTF_8)
      hasher.putString(v, StandardCharsets.UTF_8)
    }

    hasher.putString(sub.endpoint.endpoint, StandardCharsets.UTF_8)
    hasher.putString(sub.endpoint.keys.p256dh, StandardCharsets.UTF_8)
    hasher.putString(sub.endpoint.keys.auth, StandardCharsets.UTF_8)

    hasher.hash().toString
  }

  def humanReadable(query: SubscriptionQuery): String = query match {
    case WorkflowQuery(params, _) =>
      (params - "email").map { case(k, v) =>
        s"$k: ${v.mkString(", ")}"
      }.mkString(" and ")

    case PhraseQuery(phrase, _) =>
      s"""phrase: "$phrase""""
  }

  def toItem(sub: Subscription): Item =
    Item.fromJSON(sub.asJson.toString())
      .withString("id", id(sub))

  def fromItem(item: Item): Subscription =
    decode[Subscription](item.toJSON).right.get
}