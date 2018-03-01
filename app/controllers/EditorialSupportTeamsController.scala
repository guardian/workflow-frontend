package controllers

import com.gu.workflow.util.Dynamo
import config.Config
import models.{EditorialSupportStaff, StaffUpdate}
import play.api.mvc.Controller

import scala.collection.JavaConverters._

object EditorialSupportTeamsController extends Controller with PanDomainAuthActions with Dynamo {

  private val editorialSupportTable = dynamoDb.getTable(Config.editorialSupportDynamoTable)

  def listStaff(): EditorialSupportStaff = {
    val items = editorialSupportTable.scan().asScala
    EditorialSupportStaff.fromItems(items)
  }

  def applyUpdate(update: StaffUpdate): Unit = {
    val item = EditorialSupportStaff.updateToItem(update)
    editorialSupportTable.putItem(item)
  }
}