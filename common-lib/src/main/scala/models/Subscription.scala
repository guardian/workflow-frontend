package models

import java.nio.charset.StandardCharsets

import com.amazonaws.services.dynamodbv2.document.Item
import com.google.common.hash.Hashing
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
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
case class Subscription(email: String, userAgent: String, query: Subscription.Query, endpoint: SubscriptionEndpoint,
                        runtime: Option[SubscriptionRuntime])

case class SubscriptionRuntime(seenIds: Map[Long, Status])

// The actual contents of a notification fired and sent to the service worker to actually display on the users machine
case class SubscriptionUpdate(title: String, body: String, url: Option[String])

case class DeleteSubscription(id: String)

object Subscription {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val keysEncoder: Encoder[SubscriptionKeys] = deriveEncoder
  implicit val keysDecoder: Decoder[SubscriptionKeys] = deriveDecoder

  implicit val endpointEncoder: Encoder[SubscriptionEndpoint] = deriveEncoder
  implicit val endpointDecoder: Decoder[SubscriptionEndpoint] = deriveDecoder

  implicit val runtimeEncoder: Encoder[SubscriptionRuntime] = deriveEncoder
  implicit val runtimeDecoder: Decoder[SubscriptionRuntime] = deriveDecoder

  implicit val updateEncoder: Encoder[SubscriptionUpdate] = deriveEncoder
  implicit val updateDecoder: Decoder[SubscriptionUpdate] = deriveDecoder

  implicit val encoder: Encoder[Subscription] = deriveEncoder
  implicit val decoder: Decoder[Subscription] = deriveDecoder

  type Query = Map[String, Seq[String]]

  val form = Form(
    mapping("id" -> text)
    (DeleteSubscription.apply)(DeleteSubscription.unapply)
  )

  def id(sub: Subscription): String = {
    val hasher = Hashing.md5().newHasher()

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