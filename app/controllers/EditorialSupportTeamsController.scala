package controllers

import com.gu.workflow.util.Dynamo
import config.Config
import models.EditorialSupportStaff
import play.api.mvc.Controller

import scala.collection.JavaConversions._

object EditorialSupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  private val editorialSupportTable = dynamoDb.getTable(Config.editorialSupportDynamoTable)

  def listStaff(): List[EditorialSupportStaff] = {
    editorialSupportTable.scan().map(EditorialSupportStaff.fromItem).toList
  }

  def updateStaff(updated: EditorialSupportStaff): List[EditorialSupportStaff] = {
    val existing = listStaff()
    editorialSupportTable.putItem(updated.toItem)

    if(existing.exists { case EditorialSupportStaff(name, team, _, _) => updated.team == team && updated.name == name }) {
      existing.map { staff =>
        if(staff.team == updated.team && staff.name == updated.name) {
          updated
        } else {
          staff
        }
      }
    } else {
      existing :+ updated
    }
  }
}