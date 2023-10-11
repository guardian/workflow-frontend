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
    wsClient.url(url)
      .withHttpHeaders(request.headers.toSimpleMap.toSeq: _*)
      .execute(request.method)
      .map { response =>
        Ok(response.body).withHeaders(response.headers.mapValues(_.head).toSeq: _*)
      }
      .recover { case e =>
        logger.error(s"Error proxying request to $url", e)
        TemporaryRedirect( // this ensures PUT doesn't get transformed to GET, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections#temporary_redirections
          if (config.isDev) url.replaceAll(Dev.appDomain, Code.appDomain)
          else url
        )
      }
  }

  def userPref(userId: String, app: String) = proxyRequest(s"$userId/$app")
  def setPreference(userId: String, app: String, prefKey: String) = proxyRequest(s"$userId/$app/$prefKey")
  def getPreference(userId: String, app: String, prefKey: String) = proxyRequest(s"$userId/$prefKey")
}
