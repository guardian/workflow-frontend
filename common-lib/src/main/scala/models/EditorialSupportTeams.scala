package models

import com.amazonaws.services.dynamodbv2.document.Item
import play.api.libs.json.{Format, Json}

case class EditorialSupportStaff(id: String, name: String, active: Boolean, team: String, description: Option[String] = None) { def toItem = Item.fromJSON(Json.toJson(this).toString()) }

object EditorialSupportStaff {
  implicit val jw: Format[EditorialSupportStaff] = Json.format[EditorialSupportStaff]
  def fromItem(item: Item) = Json.parse(item.toJSON).as[EditorialSupportStaff]
}

case class EditorialSupportTeam(name: String, staff: List[EditorialSupportStaff]) {

  def sortActiveFirst: EditorialSupportTeam = {
    val active = staff.filter(_.active).sortBy(_.name)
    val inActive = staff.filter(!_.active).sortBy(_.name)
    EditorialSupportTeam(name, active ::: inActive)
  }
}

object EditorialSupportTeam { implicit val jf: Format[EditorialSupportTeam] = Json.format[EditorialSupportTeam] }

case class EditorialSupportStaffTracking(teams: List[EditorialSupportTeam])

object EditorialSupportStaffTracking { implicit val jf: Format[EditorialSupportStaffTracking] = Json.format[EditorialSupportStaffTracking] }
