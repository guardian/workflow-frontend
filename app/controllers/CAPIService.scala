package controllers

import com.gu.workflow.lib.ContentAPI
import play.api.mvc.Controller
import config.Config
import scala.concurrent.ExecutionContext.Implicits.global

object CAPIService extends Controller with PanDomainAuthActions{

  val contentAPI = new ContentAPI(Config.capiPreviewRole, Config.capiPreviewIamUrl)

  def previewCapiProxy(path: String) = APIAuthAction.async { request =>

    import play.api.Play.current

    contentAPI.getPreview(path, request.rawQueryString).map(response =>
      response.status match {
        case 200 => Ok(response.json)
        case _ => BadGateway(s"CAPI returned error code ${response.status}")
      })
  }

}
