package models

import java.nio.charset.StandardCharsets

import com.amazonaws.services.dynamodbv2.document.Item
import com.google.common.hash.Hashing
import io.circe.generic.extras.Configuration
import io.circe.generic.extras.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.parser.decode
import io.circe.syntax._
import io.circe.{Decoder, Encoder}

case class SubscriptionKeys(p256dh: String, auth: String)
case class SubscriptionEndpoint(endpoint: String, keys: SubscriptionKeys)
// seenIds is optional as it encodes three states:
//   None          -> we have not seen any content under the given query yet so don't fire notifications
//   Some(Nil)     -> we last saw no content matching the query
//   Some(content) -> the content we saw last (ie do a diff and fire notifications)
case class Subscription(query: Subscription.Query, seenIds: Option[List[String]], endpoint: SubscriptionEndpoint)

object Subscription {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val keysEncoder: Encoder[SubscriptionKeys] = deriveEncoder
  implicit val keysDecoder: Decoder[SubscriptionKeys] = deriveDecoder

  implicit val endpointEncoder: Encoder[SubscriptionEndpoint] = deriveEncoder
  implicit val endpointDecoder: Decoder[SubscriptionEndpoint] = deriveDecoder

  implicit val encoder: Encoder[Subscription] = deriveEncoder
  implicit val decoder: Decoder[Subscription] = deriveDecoder

  type Query = Map[String, Seq[String]]

  def queryId(query: Subscription.Query): String = {
    val hasher = Hashing.md5().newHasher()
    query.foreach { case (key, values) =>
      hasher.putString(s"$key->${values.mkString(",")}", StandardCharsets.UTF_8)
    }

    hasher.hash().toString
  }

  def endpointId(endpoint: SubscriptionEndpoint): String = {
    val hasher = Hashing.md5().newHasher()
    hasher.putString(endpoint.endpoint, StandardCharsets.UTF_8)
    hasher.putString(endpoint.keys.p256dh, StandardCharsets.UTF_8)
    hasher.putString(endpoint.keys.auth, StandardCharsets.UTF_8)

    hasher.hash().toString
  }

  def toItem(sub: Subscription): Item =
    Item.fromJSON(sub.asJson.toString())
      .withString("queryId", queryId(sub.query))
      .withString("endpointId", endpointId(sub.endpoint))

  def fromItem(item: Item): Subscription =
    decode[Subscription](item.toJSON).right.get
}