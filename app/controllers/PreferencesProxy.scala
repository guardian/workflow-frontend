package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.workflow.util.{Code, Dev}
import config.Config
import play.api.Logging
import play.api.libs.ws.{EmptyBody, InMemoryBody, WSClient}
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.ExecutionContext.Implicits.global

/* Proxy for editorial-preferences, to help with latency since workflow-frontend sits behind CloudFront*/
class PreferencesProxy(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with Logging {

  private def proxyRequest(relativePath: String) = APIAuthAction(parse.byteString).async { request =>
    val url = s"${config.preferencesUrl}/$relativePath"
    val requestHeaders = request.headers.toSimpleMap + (
      "Host" -> config.preferencesHost
    )
    val requestBody = if (request.hasBody) {
      InMemoryBody(request.body)
    } else {
      EmptyBody
    }
    wsClient.url(url)
      .withHttpHeaders(requestHeaders.toSeq: _*)
      .withBody(requestBody)
      .withFollowRedirects(false) // ensure browser handles all redirects NOT this proxy
      .execute(request.method)
      .map { response =>
        val responseHeaders = response.headers.view.mapValues(_.head).toMap + (
          "Cache-Control" -> "private, no-cache, no-store, must-revalidate, max-age=0", // do not cache whatsoever
        )
        new Status(response.status)(response.body).withHeaders(responseHeaders.toSeq: _*)
      }
      .recover {
        case _ if config.isDev =>
          TemporaryRedirect( // this ensures PUT doesn't get transformed to GET, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections#temporary_redirections
            url.replaceAll(Dev.appDomain, Code.appDomain)
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
