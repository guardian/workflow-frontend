package controllers

import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClient
import com.amazonaws.services.dynamodbv2.document.{AttributeUpdate, DynamoDB}
import com.amazonaws.services.dynamodbv2.document.spec.UpdateItemSpec
import com.gu.workflow.util.AWS.region
import config.Config
import models.{EditorialSupportStaff, EditorialSupportTeam}
import play.api.mvc.Controller

import scala.collection.JavaConversions._

object EditorialSupportTeamsController extends Controller with PanDomainAuthActions {

  lazy val DynamoDb = region.createClient(classOf[AmazonDynamoDBClient], awsCredentialsProvider(), null)
  lazy val dynamoDb = new DynamoDB(DynamoDb)
  val editorialSupportTable = dynamoDb.getTable(Config.editorialSupportDynamoTable)

  def createNewStaff(name: String, team: String) = {
    editorialSupportTable.putItem(EditorialSupportStaff(java.util.UUID.randomUUID().toString, name, false, team).toItem)
  }

  def getStaff(): List[EditorialSupportStaff] = {
    editorialSupportTable.scan().map(EditorialSupportStaff.fromItem).toList
  }

  def getTeams():List[EditorialSupportTeam] = {
    getStaff().groupBy(_.team).map(x => EditorialSupportTeam(x._1, x._2)).toList
  }

  def toggleStaffStatus(id: String, active: Boolean) = {
    editorialSupportTable.updateItem(
      new UpdateItemSpec()
        .withPrimaryKey("id", id)
        .withAttributeUpdate(new AttributeUpdate("active").put(if (active) true else false))
    )
  }

  def updateStaffDescription(id: String, description: String) = {
    if (description.isEmpty) {
      editorialSupportTable.updateItem(
        new UpdateItemSpec()
          .withPrimaryKey("id", id)
          .withAttributeUpdate(new AttributeUpdate("description").delete())
      )
    } else {
      editorialSupportTable.updateItem(
        new UpdateItemSpec()
          .withPrimaryKey("id", id)
          .withAttributeUpdate(new AttributeUpdate("description").put(description))
      )
    }
  }

}