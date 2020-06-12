import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI, StubAPI}
import com.gu.workflow.lib.TagService
import com.gu.workflow.util.AWS
import config.Config
import controllers._
import lib.LoggingFilter
import play.api.ApplicationLoader.Context
import play.api.BuiltInComponentsFromContext
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.filters.HttpFiltersComponents
import play.filters.cors.{CORSComponents, CORSConfig}
import play.filters.cors.CORSConfig.Origins
import router.Routes

class AppComponents(context: Context)
  extends BuiltInComponentsFromContext(context)
  with HttpFiltersComponents
  with AhcWSComponents
  with AssetsComponents
  with CORSComponents {

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
  val sectionsApi = new SectionsAPI(config.apiRoot, wsClient)
  val desksApi = new DesksAPI(config.apiRoot, wsClient)
  val sectionsDeskMappingsApi = new SectionDeskMappingsAPI(config.apiRoot, wsClient)
  val stubsApi = new StubAPI(config.apiRoot, wsClient)
  val tagService = new TagService(config.tagManagerUrl, wsClient)

  val adminController = new Admin(sectionsApi, desksApi, sectionsDeskMappingsApi, config, controllerComponents, wsClient, panDomainRefresher)
  val editorialSupportTeamsController = new EditorialSupportTeamsController(config, controllerComponents, wsClient, panDomainRefresher)
  val apiController = new Api(stubsApi, sectionsApi, editorialSupportTeamsController, config, controllerComponents, wsClient, panDomainRefresher)
  val applicationController = new Application(editorialSupportTeamsController, sectionsApi, tagService, desksApi, sectionsDeskMappingsApi, config, controllerComponents, wsClient, panDomainRefresher)

  val notificationsController = new Notifications(config, controllerComponents, wsClient, panDomainRefresher)

  val supportController = new Support(config, controllerComponents, wsClient, panDomainRefresher)

  override val router = new Routes(
    httpErrorHandler,
    applicationController,
    notificationsController,
    loginController,
    apiController,
    capiServiceController,
    adminController,
    supportController,
    managementController,
    assets
  )

  final override lazy val corsConfig: CORSConfig = CORSConfig.fromConfiguration(context.initialConfiguration).copy(
    allowedOrigins = Origins.Matching(Set(config.host) ++ config.corsAllowedDomains)
  )

  override lazy val httpFilters: Seq[EssentialFilter] = {
    // corsFilter before csrfFilter to allow other Tools to call the api
    // see https://www.playframework.com/documentation/2.7.x/ScalaCsrf#Trusting-CORS-requests
    Seq(corsFilter, csrfFilter, securityHeadersFilter, new LoggingFilter(materializer))
  }
}
