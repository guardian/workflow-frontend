package models

import com.amazonaws.services.dynamodbv2.document.Item
import io.circe.generic.extras.{Configuration, semiauto => derivationWithDefaults}
import io.circe.{Decoder, Encoder}
import io.circe.syntax._
import io.circe.parser.decode
import play.api.data.Forms._
import play.api.data._

case class TeamMember(name: String, team: String, active: Boolean, description: Option[String])
case class FrontsEditor(name: String, front: String)

case class StaffUpdate(category: String, name: String, team: String, active: Boolean, description: Option[String])

case class EditorialSupportTeam(name: String, staff: List[TeamMember])
case class EditorialSupportStaff(teamMembers: List[TeamMember], frontsEditors: List[FrontsEditor])

object EditorialSupportStaff {
  implicit val customConfig: Configuration = Configuration.default.withDefaults

  implicit val teamMemberEncoder: Encoder[TeamMember] = derivationWithDefaults.deriveEncoder
  implicit val teamMemberDecoder: Decoder[TeamMember] = derivationWithDefaults.deriveDecoder

  implicit val frontsEditorEncoder: Encoder[FrontsEditor] = derivationWithDefaults.deriveEncoder
  implicit val frontsEditorDecoder: Decoder[FrontsEditor] = derivationWithDefaults.deriveDecoder

  implicit val teamEncoder: Encoder[EditorialSupportTeam] = derivationWithDefaults.deriveEncoder
  implicit val teamDecoder: Decoder[EditorialSupportTeam] = derivationWithDefaults.deriveDecoder

  val form = Form(
    mapping(
      "category" -> text,
      "name" -> text,
      "team" -> text,
      "active" -> optional(text), // HTML form checkboxes return "on" instead of "true"
      "description" -> optional(text)
    ) {
      (category, name, team, active, description) =>
        StaffUpdate(category, name, team, active.contains("on"), description)
    } {
      u => Some((u.category, u.name, u.team, if(u.active) { Some("on") } else { None }, u.description))
    }
  )

  def teamByName(team: String, staff: EditorialSupportStaff): EditorialSupportTeam = {
    EditorialSupportTeam(team, staff.teamMembers.filter(_.team == team))
  }

  def frontsTeam(staff: EditorialSupportStaff): EditorialSupportTeam = {
    // Group fronts by people working on them to create the description
    EditorialSupportTeam("fronts", staff.frontsEditors.groupBy(_.name).toList.map { case(name, fronts) =>
      TeamMember(name, "Fronts", active = true, description = Some(fronts.map(_.front).mkString(", ")))
    })
  }

  def fromItems(items: Iterable[Item]): EditorialSupportStaff = {
    val base = EditorialSupportStaff(List.empty, List.empty)

    items.foldLeft(base) { (acc, item) =>
      item.getString("category") match {
        case "team_member" =>
          val json = item.getString("data")
          val teamMember = decode[TeamMember](json).right.get

          acc.copy(teamMembers = acc.teamMembers :+ teamMember)

        case "fronts_editor" =>
          val json = item.getString("data")
          val frontsEditor = decode[FrontsEditor](json).right.get

          acc.copy(frontsEditors = acc.frontsEditors :+ frontsEditor)

        case other =>
          throw new IllegalStateException(s"Unknown editorial staff category $other")
      }
    }
  }

  def updateToItem(update: StaffUpdate): Item = update.category match {
    case "team_member" =>
      val data = TeamMember(update.name, update.team, update.active, update.description)

      new Item()
        .withString("name", update.name)
        .withString("category", "team_member")
        .withString("data", data.asJson.toString())

    case "fronts_editor" =>
      val data = FrontsEditor(update.name, update.team)

      new Item()
        .withString("name", update.name)
        .withString("category", "fronts_editor")
        .withString("data", data.asJson.toString())

    case other =>
      throw new IllegalStateException(s"Unknown editorial staff category $other")
  }
}
