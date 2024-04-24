package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import com.gu.workflow.lib.ContentAPI
import config.Config
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}

class CAPIService(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher,
  override val permissions: PermissionsProvider,
) extends BaseController with PanDomainAuthActions {

  private val contentApi = new ContentAPI(config.capiPreviewRole, config.capiPreviewIamUrl, wsClient)

  def previewCapiProxy(path: String): Action[AnyContent] = APIAuthAction.async { request =>
    import scala.concurrent.ExecutionContext.Implicits.global

    val queryString: List[(String, String)] = request.queryString.toList.map { case (a, b) if b.nonEmpty => (a, b.head) }

    contentApi.getPreview(path, queryString).map(response =>
      response.status match {
        case 200 => Ok(response.json)
        case _ => BadGateway(s"CAPI returned error code ${response.status}")
      }
    )
  }
}
