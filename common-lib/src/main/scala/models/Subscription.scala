package models

import java.nio.charset.StandardCharsets

import com.amazonaws.services.dynamodbv2.document.Item
import com.google.common.hash.Hashing
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveConfiguredDecoder, deriveConfiguredEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import io.circe.{Decoder, Encoder}
import play.api.data.Forms._
import play.api.data._

// These are the details provided by the browser as registered to the service worker
case class SubscriptionKeys(p256dh: String, auth: String)
case class SubscriptionEndpoint(endpoint: String, keys: SubscriptionKeys)

// runtime is optional as it encodes three states:
//   None            -> we have not seen any content under the given query yet so don't fire notifications
//   Some(Map.empty) -> we last saw no content matching the query
//   Some(content)   -> the content we saw last and the status it was in (ie do a diff and fire notifications)
case class Subscription(
  email: String,
  userAgent: String,
  query: Subscription.Query,
  description: Option[String],
  endpoint: SubscriptionEndpoint,
  schedule: SubscriptionSchedule,
  runtime: Option[SubscriptionRuntime]
)

case class SubscriptionRuntime(seenIds: Map[Long, Status])
case class SubscriptionSchedule(enabled: Boolean)

// The actual contents of a notification fired and sent to the service worker to actually display on the users machine
case class SubscriptionUpdate(title: String, body: String, url: Option[String])

object Subscription {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val keysEncoder: Encoder[SubscriptionKeys] = deriveConfiguredEncoder
  implicit val keysDecoder: Decoder[SubscriptionKeys] = deriveConfiguredDecoder

  implicit val endpointEncoder: Encoder[SubscriptionEndpoint] = deriveConfiguredEncoder
  implicit val endpointDecoder: Decoder[SubscriptionEndpoint] = deriveConfiguredDecoder

  implicit val runtimeEncoder: Encoder[SubscriptionRuntime] = deriveConfiguredEncoder
  implicit val runtimeDecoder: Decoder[SubscriptionRuntime] = deriveConfiguredDecoder

  implicit val scheduleEncoder: Encoder[SubscriptionSchedule] = deriveConfiguredEncoder
  implicit val scheduleDecoder: Decoder[SubscriptionSchedule] = deriveConfiguredDecoder

  implicit val updateEncoder: Encoder[SubscriptionUpdate] = deriveConfiguredEncoder
  implicit val updateDecoder: Decoder[SubscriptionUpdate] = deriveConfiguredDecoder

  implicit val encoder: Encoder[Subscription] = deriveConfiguredEncoder
  implicit val decoder: Decoder[Subscription] = deriveConfiguredDecoder

  type Query = Map[String, Seq[String]]

  val form = Form(
    tuple(
      "id" -> text,
      "enabled" -> boolean,
      "delete" -> optional(boolean)
    )
  )

  def id(sub: Subscription): String = {
    val hasher = Hashing.sha256().newHasher()

    // Sort for stable iteration order to ensure consistent hash
    val params = sub.query.toList.flatMap { case(k, v) => v.map(k -> _) }.sorted
    params.foreach { case(k, v) =>
      hasher.putString(k, StandardCharsets.UTF_8)
      hasher.putString(v, StandardCharsets.UTF_8)
    }

    hasher.putString(sub.endpoint.endpoint, StandardCharsets.UTF_8)
    hasher.putString(sub.endpoint.keys.p256dh, StandardCharsets.UTF_8)
    hasher.putString(sub.endpoint.keys.auth, StandardCharsets.UTF_8)

    hasher.hash().toString
  }

  def humanReadable(query: Query): String = {
    (query - "email").map { case(k, v) =>
      s"$k: ${v.mkString(", ")}"
    }.mkString(" and ")
  }

  def toItem(sub: Subscription): Item =
    Item.fromJSON(sub.asJson.toString())
      .withString("id", id(sub))

  def fromItem(item: Item): Subscription =
    decode[Subscription](item.toJSON).right.get
}
