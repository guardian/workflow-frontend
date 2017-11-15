package models

import com.amazonaws.services.dynamodbv2.document.Item
import io.circe.generic.extras.{Configuration, semiauto => derivationWithDefaults}
import io.circe.generic.{semiauto => basicDerivation}
import io.circe.parser.decode
import io.circe.syntax._
import io.circe.{Decoder, Encoder}

case class EditorialSupportStaff(id: String, name: String, active: Boolean, team: String, description: Option[String] = None) {
  def toItem = Item.fromJSON(this.asJson.toString())
}

object EditorialSupportStaff {
  implicit val customConfig: Configuration = Configuration.default.withDefaults
  implicit val encoder: Encoder[EditorialSupportStaff] = derivationWithDefaults.deriveEncoder
  implicit val decoder: Decoder[EditorialSupportStaff] = derivationWithDefaults.deriveDecoder
  def fromItem(item: Item): EditorialSupportStaff =
    decode[EditorialSupportStaff](item.toJSON).right.get
}

case class EditorialSupportTeam(name: String, staff: List[EditorialSupportStaff])
object EditorialSupportTeam {
  implicit val encoder: Encoder[EditorialSupportTeam] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[EditorialSupportTeam] = basicDerivation.deriveDecoder
}

case class EditorialSupportStaffTracking(teams: List[EditorialSupportTeam])
object EditorialSupportStaffTracking {
  implicit val encoder: Encoder[EditorialSupportStaffTracking] = basicDerivation.deriveEncoder
  implicit val decoder: Decoder[EditorialSupportStaffTracking] = basicDerivation.deriveDecoder
}
