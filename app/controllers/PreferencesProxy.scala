package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.workflow.util.{Code, Dev}
import config.Config
import play.api.Logging
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.ExecutionContext.Implicits.global

/* Proxy for editorial-preferences, to help with latency since workflow-frontend sits behind CloudFront*/
class PreferencesProxy(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with Logging {

  private def proxyRequest(relativePath: String) = APIAuthAction.async { request =>
    val url = s"${config.preferencesUrl}/$relativePath"
    val headers = request.headers.toSimpleMap + (
      "Host" -> config.preferencesHost,
      "Cache-Control" -> "private, no-cache, no-store, must-revalidate, max-age=0", // do not cache whatsoever
    )
    wsClient.url(url)
      .withHttpHeaders(headers.toSeq: _*)
      .execute(request.method)
      .map { response =>
        new Status(response.status)(response.body).withHeaders(response.headers.mapValues(_.head).toSeq: _*)
      }
      .recover {
        case _ if config.isDev =>
          TemporaryRedirect( // this ensures PUT doesn't get transformed to GET, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections#temporary_redirections
            if (config.isDev) url.replaceAll(Dev.appDomain, Code.appDomain)
            else url
          )
        case e =>
          logger.error(s"Error proxying request to $url", e)
          InternalServerError
      }
  }

  def userPref(userId: String, app: String) = proxyRequest(s"$userId/$app")
  def setPreference(userId: String, app: String, prefKey: String) = proxyRequest(s"$userId/$app/$prefKey")
  def getPreference(userId: String, app: String, prefKey: String) = proxyRequest(s"$userId/$prefKey")
}
