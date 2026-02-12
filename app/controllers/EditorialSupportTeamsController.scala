package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import com.gu.workflow.util.Dynamo
import config.Config
import models.{EditorialSupportStaff, StaffUpdate}
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}
import software.amazon.awssdk.enhanced.dynamodb._

import scala.jdk.CollectionConverters._

class EditorialSupportTeamsController(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher,
  override val permissions: PermissionsProvider
) extends BaseController with PanDomainAuthActions with Dynamo {

  private val editorialSupportTable = dynamoDb.table(config.editorialSupportDynamoTable,
    TableSchema.documentSchemaBuilder
      .addIndexPartitionKey(TableMetadata.primaryIndexName,"id", AttributeValueType.S)
      .attributeConverterProviders(AttributeConverterProvider.defaultProvider)
      .build)

  def listStaff(): List[EditorialSupportStaff] = {
    val items = editorialSupportTable.scan().items().asScala.toList
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
        editorialSupportTable.deleteItem(Key.builder.partitionValue(s"${update.team}-${update.name}").build)

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
    editorialSupportTable.putItem(EditorialSupportStaff.toItem(staff))
  }
}
