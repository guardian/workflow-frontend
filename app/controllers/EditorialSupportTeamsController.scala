package controllers

import com.gu.workflow.util.Dynamo
import config.Config
import models.EditorialSupportStaff
import play.api.mvc.Controller

import scala.collection.JavaConverters._

object EditorialSupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  private val editorialSupportTable = dynamoDb.getTable(Config.editorialSupportDynamoTable)

  def listStaff(): List[EditorialSupportStaff] = {
    editorialSupportTable.scan().asScala.toList.map(EditorialSupportStaff.fromItem)
  }

  def updateStaff(staff: EditorialSupportStaff): Unit = {
    editorialSupportTable.putItem(EditorialSupportStaff.toItem(staff))
  }
}