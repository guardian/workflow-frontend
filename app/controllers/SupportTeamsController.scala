package controllers

import com.amazonaws.services.dynamodbv2.document.AttributeUpdate
import com.amazonaws.services.dynamodbv2.document.spec.UpdateItemSpec
import com.gu.workflow.util.Dynamo
import model.{Staff, SupportTeam}
import play.api.mvc.Controller

import scala.collection.JavaConversions._

object SupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  def createNewStaff(name: String, team: String) = {
    supportStaff.putItem(Staff(java.util.UUID.randomUUID().toString, name, false, team).toItem)
  }

  def getStaff(): List[Staff] = {
    supportStaff.scan().map(Staff.fromItem).toList
  }

  def getTeams():List[SupportTeam] = {
    getStaff().groupBy(_.team).map(x => SupportTeam(x._1, x._2)).toList
  }

  def toggleStaffStatus(id: String, active: Boolean) = {
    supportStaff.updateItem(
      new UpdateItemSpec().
        withPrimaryKey("id", id)
        .withAttributeUpdate(new AttributeUpdate("active").put(if (active) true else false))
    )
  }

}