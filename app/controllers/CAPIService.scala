package controllers

import play.api.libs.ws.{WS, WSAuthScheme, WSResponse}
import config.Config
import play.api.libs.ws.WSAuthScheme.BASIC
import play.api.mvc.Controller
import play.api.Play.current

object CAPIService extends Controller with PanDomainAuthActions{

  def previewCapiProxy(path: String) = APIAuthAction.async { request =>

    import scala.concurrent.ExecutionContext.Implicits.global

    val req = WS
      .url(s"${Config.contentApiUrl}/$path?${request.rawQueryString}")
      .withAuth(Config.capiPreviewUsername, Config.capiPreviewPassword, BASIC)
      .get()

    req.map(response => response.status match {
      case 200 => Ok(response.json)
      case _ => BadGateway(s"CAPI returned error code ${response.status}")
    })
  }

}
