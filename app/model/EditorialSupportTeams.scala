package model

import com.amazonaws.services.dynamodbv2.document.Item
import play.api.libs.json.Json

case class EditorialSupportStaff(id: String, name: String, active: Boolean, team: String) { def toItem = Item.fromJSON(Json.toJson(this).toString()) }

object EditorialSupportStaff {
  implicit val jf = Json.format[EditorialSupportStaff]
  def fromItem(item: Item) = Json.parse(item.toJSON).as[EditorialSupportStaff]
}

case class EditorialSupportTeam(name: String, staff: List[EditorialSupportStaff])

object EditorialSupportTeam { implicit val jf = Json.format[EditorialSupportTeam] }

case class EditorialSupportStaffTracking(teams: List[EditorialSupportTeam])

object EditorialSupportStaffTracking { implicit val jf = Json.format[EditorialSupportStaffTracking] }
