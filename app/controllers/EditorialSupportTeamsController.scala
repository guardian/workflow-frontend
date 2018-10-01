package controllers

import com.gu.workflow.util.Dynamo
import config.Config
import models.{EditorialSupportStaff, StaffUpdate}
import play.api.mvc.Controller

import scala.collection.JavaConverters._

object EditorialSupportTeamsController extends Controller with MaybeAuth with Dynamo {

  private lazy val editorialSupportTable = dynamoDb.getTable(Config.editorialSupportDynamoTable)

  def listStaff(): List[EditorialSupportStaff] = {
    val items = editorialSupportTable.scan().asScala.toList
    val staff = items.map(EditorialSupportStaff.fromItem)

    staff.map {
      case s if s.name == "none" => s.copy(name = "")
      case s => s
    }
  }

  def updateStaff(update: StaffUpdate): Unit = {
    val name = if(update.name == "") { "none" } else { update.name }

    update.action match {
      case "delete" =>
        editorialSupportTable.deleteItem("id", s"${update.team}-${update.name}")

      case "add_front" =>
        save(EditorialSupportStaff(
          id = s"Fronts-${update.team}",
          name,
          update.team,
          active = true,
          description = None
        ))

      case _ =>
        save(EditorialSupportStaff(
          id = update.id.getOrElse(s"${update.team}-${update.name}"),
          name,
          update.team,
          update.active.contains("on"),
          update.description
        ))
    }
  }

  private def save(staff: EditorialSupportStaff): Unit = {
//    editorialSupportTable.putItem(EditorialSupportStaff.toItem(staff))
  }
}