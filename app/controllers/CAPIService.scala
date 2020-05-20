package controllers

import java.net.URI

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, STSAssumeRoleSessionCredentialsProvider}
import com.gu.contentapi.client.IAMSigner
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.workflow.util.AWS
import config.Config
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}

class CAPIService(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions {

  private val previewSigner = {
    val capiPreviewCredentials = new AWSCredentialsProviderChain(
      new ProfileCredentialsProvider("capi"),
      new STSAssumeRoleSessionCredentialsProvider.Builder(config.capiPreviewRole, "capi").build()
    )

    new IAMSigner(
      credentialsProvider = capiPreviewCredentials,
      awsRegion = AWS.region.getName
    )
  }

  def previewCapiProxy(path: String): Action[AnyContent] = APIAuthAction.async { request =>

    import scala.concurrent.ExecutionContext.Implicits.global

    val url = s"${config.capiPreviewIamUrl}/$path?${request.rawQueryString}"
    val headers = previewSigner.addIAMHeaders(Map.empty, URI.create(url))

    val req = wsClient
      .url(url)
      .withHeaders(headers.toSeq: _*)
      .get()

    req.map(response => response.status match {
      case 200 => Ok(response.json)
      case _ => BadGateway(s"CAPI returned error code ${response.status}")
    })
  }
}
