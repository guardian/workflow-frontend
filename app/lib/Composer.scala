package lib

import play.api.libs.json.JsValue
import config.Config

object Composer {

  //default to localhost for now
  lazy val baseUrl = Config.composerUrl
  lazy val newContentUrl = baseUrl + "/api/content"
  lazy val adminUrl = baseUrl + "/content"
  lazy val contentDetails = baseUrl + "/api/content/"

  def parseId(json: JsValue): Option[String] = {
    (json \ "data" \ "id").asOpt[String]
  }
}
