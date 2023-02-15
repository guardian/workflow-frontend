package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import config.Config
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import java.util.concurrent.{Executors, TimeUnit}

class PeopleService(
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher,
  val permissions: PermissionsProvider,
) extends BaseController with PanDomainAuthActions {

  @volatile private var emailsPartsCache: Set[(String, Array[String])] = Set.empty

  private def buildEmailsPartsCache() = permissions.allUserEmails().flatMap(email =>
    email.toLowerCase()
      .split('@').headOption.map(
      email -> _.split('.')
    )
  )

  Executors.newScheduledThreadPool(1).scheduleAtFixedRate(new Runnable() {
    override def run(): Unit = {
      emailsPartsCache = buildEmailsPartsCache()
    }
  }, 1, 15, TimeUnit.MINUTES)


  def searchPeople(prefix: String) = APIAuthAction {
    val searchParts = prefix.toLowerCase().split(Array(' ', '.'))
    def allSearchPartsMatch(partsBeforeAt: Array[String]) = searchParts.forall(searchPart =>
      partsBeforeAt.exists(
        _.startsWith(searchPart)
      )
    )
    val emailsParts = if(emailsPartsCache.isEmpty) buildEmailsPartsCache() else emailsPartsCache
    Ok(
      Json.toJson(
        emailsParts.collect{
          case (email, partsBeforeAt) if allSearchPartsMatch(partsBeforeAt) => email
        }.take(5)
      )
    )
  }
}
