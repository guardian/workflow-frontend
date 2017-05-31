package model

import com.amazonaws.services.dynamodbv2.document.Item
import play.api.libs.json.Json

case class Staff(id: String, name: String, active: Boolean, team: String) { def toItem = Item.fromJSON(Json.toJson(this).toString()) }

object Staff {
  implicit val jf = Json.format[Staff]
  def fromItem(item: Item) = Json.parse(item.toJSON).as[Staff]
}

case class SupportTeam(name: String, staff: List[Staff])

object SupportTeam { implicit val jf = Json.format[SupportTeam] }

case class SupportStaffTracking(teams: List[SupportTeam])

object SupportStaffTracking { implicit val jf = Json.format[SupportStaffTracking] }
