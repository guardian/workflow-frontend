package controllers

import com.amazonaws.services.dynamodbv2.document.AttributeUpdate
import com.amazonaws.services.dynamodbv2.document.spec.UpdateItemSpec
import com.gu.workflow.util.Dynamo
import model.{EditorialSupportStaff, EditorialSupportTeam}
import play.api.mvc.Controller

import scala.collection.JavaConversions._

object EditorialSupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  def createNewStaff(name: String, team: String) = {
    editorialSupportStaff.putItem(EditorialSupportStaff(java.util.UUID.randomUUID().toString, name, false, team).toItem)
  }

  def getStaff(): List[EditorialSupportStaff] = {
    editorialSupportStaff.scan().map(EditorialSupportStaff.fromItem).toList
  }

  def getTeams():List[EditorialSupportTeam] = {
    getStaff().groupBy(_.team).map(x => EditorialSupportTeam(x._1, x._2)).toList
  }

  def toggleStaffStatus(id: String, active: Boolean) = {
    editorialSupportStaff.updateItem(
      new UpdateItemSpec().
        withPrimaryKey("id", id)
        .withAttributeUpdate(new AttributeUpdate("active").put(if (active) true else false))
    )
  }

}