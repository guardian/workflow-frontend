package models

import com.amazonaws.services.dynamodbv2.document.Item
import io.circe.generic.extras.{Configuration, semiauto => derivationWithDefaults}
import io.circe.{Decoder, Encoder}
import io.circe.syntax._
import io.circe.parser.decode
import play.api.data.Forms._
import play.api.data._

case class EditorialSupportStaff(id: String, name: String, team: String, active: Boolean, description: Option[String])
case class EditorialSupportTeam(name: String, staff: List[EditorialSupportStaff])

object EditorialSupportStaff {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val teamMemberEncoder: Encoder[EditorialSupportStaff] = derivationWithDefaults.deriveEncoder
  implicit val teamMemberDecoder: Decoder[EditorialSupportStaff] = derivationWithDefaults.deriveDecoder

  implicit val teamEncoder: Encoder[EditorialSupportTeam] = derivationWithDefaults.deriveEncoder
  implicit val teamDecoder: Decoder[EditorialSupportTeam] = derivationWithDefaults.deriveDecoder

  val form = Form(
    mapping(
      "id" -> optional(text),
      "name" -> text,
      "team" -> text,
      "active" -> optional(text), // HTML form checkboxes return "on" instead of "true"
      "description" -> optional(text)
    ) {
      (id, name, team, active, description) =>
        EditorialSupportStaff(id.getOrElse(s"$team-$name"), name, team, active.contains("on"), description)
    } {
      u => Some((Some(u.id), u.name, u.team, if(u.active) { Some("on") } else { None }, u.description))
    }
  )

  def toItem(staff: EditorialSupportStaff): Item =
    Item.fromJSON(staff.asJson.toString())

  def fromItem(item: Item): EditorialSupportStaff =
    decode[EditorialSupportStaff](item.toJSON).right.get

  def groupByTeams(staff: List[EditorialSupportStaff]): List[EditorialSupportTeam] = {
    staff.foldLeft(Map.empty[String, List[EditorialSupportStaff]]) { (teams, member) =>
        if(member.id.startsWith("front_")) {
          addToTeam(teams, "Fronts", member)
        } else {
          addToTeam(teams, member.team, member)
        }
    }.map { case(teamName, members) =>
      EditorialSupportTeam(teamName, members)
    }.toList
  }

  def getTeam(name: String, teams: List[EditorialSupportTeam]): EditorialSupportTeam = {
    teams.find(_.name == name).getOrElse(EditorialSupportTeam(name, List.empty))
  }

  private def addToTeam(teams: Map[String, List[EditorialSupportStaff]], team: String, member: EditorialSupportStaff) = {
    val before = teams.getOrElse(team, List.empty)
    val after = before :+ member

    teams + (team -> after)
  }
}
