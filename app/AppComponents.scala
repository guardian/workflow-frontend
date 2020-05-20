import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.workflow.api.ApiUtils
import com.gu.workflow.util.AWS
import config.Config
import controllers._
import play.api.ApplicationLoader.Context
import play.api.BuiltInComponentsFromContext
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.filters.HttpFiltersComponents

class AppComponents(context: Context)
  extends BuiltInComponentsFromContext(context)
  with HttpFiltersComponents
  with AhcWSComponents {

  val config = new Config(context.initialConfiguration)

  val panDomainRefresher = new PanDomainAuthSettingsRefresher(
    domain = config.domain,
    system = config.pandaSystem,
    bucketName = config.pandaBucketName,
    settingsFileKey = config.pandaSettingsFile,
    s3Client = AWS.S3Client
  )

  val managementController = new Management(controllerComponents)
  val loginController = new Login(config, controllerComponents, wsClient, panDomainRefresher)
  val capiServiceController = new CAPIService(config, controllerComponents, wsClient, panDomainRefresher)
  val adminController = new Admin(config, controllerComponents, wsClient, panDomainRefresher)
  val editorialSupportTeamsController = new EditorialSupportTeamsController(config, controllerComponents, wsClient, panDomainRefresher)
  val apiUtils = new ApiUtils(???, wsClient)
  val apiController = new Api(apiUtils, editorialSupportTeamsController, config, controllerComponents, wsClient, panDomainRefresher)
  val applicationController = new Application(editorialSupportTeamsController, config, controllerComponents, wsClient, panDomainRefresher)

  // TODO re-order per routes file
  override val router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    apiController,
    capiServiceController,
    adminController,
    managementController
  )
  override lazy val httpFilters: Seq[EssentialFilter] = super.httpFilters.filterNot(_ == allowedHostsFilter)
}
