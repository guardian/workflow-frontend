package models

import com.amazonaws.services.dynamodbv2.document.Item
import io.circe.generic.extras.{Configuration, semiauto => derivationWithDefaults}
import io.circe.generic.{semiauto => basicDerivation}
import io.circe.parser.decode
import io.circe.syntax._
import io.circe.{Decoder, Encoder}
import play.api.data._
import play.api.data.Forms._
import play.api.data.validation.Constraints._

case class EditorialSupportStaff(name: String, team: String, active: Boolean, description: Option[String] = None) {
  def toItem = Item.fromJSON(this.asJson.toString())
}

object EditorialSupportStaff {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[EditorialSupportStaff] = derivationWithDefaults.deriveEncoder
  implicit val decoder: Decoder[EditorialSupportStaff] = derivationWithDefaults.deriveDecoder

  def fromItem(item: Item): EditorialSupportStaff =
    decode[EditorialSupportStaff](item.toJSON).right.get

  val staffForm = Form(
    mapping(
      "name" -> text,
      "team" -> text,
      "active" -> optional(boolean),
      "description" -> optional(text)
    )
    { (name, team, maybeActive, description) => EditorialSupportStaff(name, team, maybeActive.getOrElse(false), description) }
    { e => Some((e.name, e.team, Some(e.active), e.description)) }
  )
}

case class EditorialSupportTeam(name: String, staff: List[EditorialSupportStaff])
object EditorialSupportTeam {
  implicit val encoder: Encoder[EditorialSupportTeam] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[EditorialSupportTeam] = basicDerivation.deriveDecoder
}
