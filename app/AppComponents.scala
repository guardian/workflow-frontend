import com.gu.pandomainauth.{PanDomainAuthSettingsRefresher, S3BucketLoader}
import com.gu.permissions.{PermissionsConfig, PermissionsProvider}
import com.gu.workflow.api.{DesksAPI, SectionDeskMappingsAPI, SectionsAPI, StubAPI}
import com.gu.workflow.lib.TagService
import com.gu.workflow.util.AWS
import config.Config
import controllers._
import lib.HMACClient
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

  val panDomainRefresher = PanDomainAuthSettingsRefresher(
    domain = config.domain,
    system = config.pandaSystem,
    S3BucketLoader.forAwsSdkV2(AWS.S3, config.pandaBucketName)
  )

  val stage = if (config.isProd) "PROD" else "CODE";

  // TO DO - config.hmacSecrets.head will throw if list is empty
  val datastoreHmacClient = new HMACClient(stage, config.hmacSecrets.head)

  val permissions: PermissionsProvider =
    PermissionsProvider(PermissionsConfig(stage, AWS.region.toString, AWS.credentialsProvider))

  val managementController = new Management(controllerComponents)
  val loginController = new Login(config, controllerComponents, wsClient, panDomainRefresher, permissions)
  val capiServiceController = new CAPIService(config, controllerComponents, wsClient, panDomainRefresher, permissions)
  val sectionsApi = new SectionsAPI(config.apiRoot, wsClient, datastoreHmacClient.getHMACHeaders)
  val desksApi = new DesksAPI(config.apiRoot, wsClient, datastoreHmacClient.getHMACHeaders)
  val sectionsDeskMappingsApi = new SectionDeskMappingsAPI(config.apiRoot, wsClient, datastoreHmacClient.getHMACHeaders)
  val stubsApi = new StubAPI(config.apiRoot, wsClient, datastoreHmacClient.getHMACHeaders)
  val tagService = new TagService(config.tagManagerUrl, wsClient)
  
  val adminController = new Admin(sectionsApi, desksApi, sectionsDeskMappingsApi, permissions, config, controllerComponents, wsClient, panDomainRefresher)
  val editorialSupportTeamsController = new EditorialSupportTeamsController(config, controllerComponents, wsClient, panDomainRefresher, permissions)
  val apiController = new Api(stubsApi, sectionsApi, editorialSupportTeamsController, config, controllerComponents, wsClient, panDomainRefresher, permissions)
  val applicationController = new Application(editorialSupportTeamsController, sectionsApi, tagService, desksApi, sectionsDeskMappingsApi, permissions, config, controllerComponents, wsClient, panDomainRefresher, stubsApi)
  val peopleServiceController = new PeopleService(config, controllerComponents, wsClient, panDomainRefresher, permissions)

  val preferencesProxyController = new PreferencesProxy(config, controllerComponents, wsClient, panDomainRefresher, permissions)

  val supportController = new Support(config, controllerComponents, wsClient, panDomainRefresher, permissions)

  override val router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    apiController,
    peopleServiceController,
    capiServiceController,
    adminController,
    supportController,
    managementController,
    assets,
    preferencesProxyController
  )

  final override lazy val corsConfig: CORSConfig = CORSConfig.fromConfiguration(context.initialConfiguration).copy(
    allowedOrigins = Origins.Matching(Set(config.host) ++ config.corsAllowedDomains ++ config.corsAllowedOrigins)
  )

  override lazy val httpFilters: Seq[EssentialFilter] = {
    // corsFilter before csrfFilter to allow other Tools to call the api
    // see https://www.playframework.com/documentation/2.7.x/ScalaCsrf#Trusting-CORS-requests
    Seq(corsFilter, csrfFilter, securityHeadersFilter, new LoggingFilter(materializer))
  }
}
