package controllers

import java.net.URI

import com.amazonaws.auth.{AWSCredentialsProviderChain, STSAssumeRoleSessionCredentialsProvider}
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.gu.contentapi.client.IAMSigner
import play.api.libs.ws.WS
import config.Config
import play.api.mvc.Controller
import play.api.Play.current
import com.gu.workflow.util.AWS

object CAPIService extends Controller with MaybeAuth {

  private val previewSigner = {
    val capiPreviewCredentials = new AWSCredentialsProviderChain(
      new ProfileCredentialsProvider("capi"),
      new STSAssumeRoleSessionCredentialsProvider.Builder(Config.capiPreviewRole, "capi").build()
    )

    new IAMSigner(
      credentialsProvider = capiPreviewCredentials,
      awsRegion = AWS.region.getName
    )
  }

  def previewCapiProxy(path: String) = maybeAPIAuth.async { request =>

    import scala.concurrent.ExecutionContext.Implicits.global

    val url = s"${Config.capiPreviewIamUrl}/$path?${request.rawQueryString}"
    val headers = previewSigner.addIAMHeaders(Map.empty, URI.create(url))

    val req = WS
      .url(url)
      .withHeaders(headers.toSeq: _*)
      .get()

    req.map(response => response.status match {
      case 200 => Ok(response.json)
      case _ => BadGateway(s"CAPI returned error code ${response.status}")
    })
  }

}
