package lib

import play.api.libs.json.{JsString, JsValue}
import scala.util.Try

object Composer {

  import play.api.Play.current
  val config = play.api.Play.configuration
  //default to localhost for now
  lazy val baseUrl = config.getString("composer.url").getOrElse("http://localhost:9081")
  lazy val newContentUrl = baseUrl + "/api/content"
  lazy val adminUrl = baseUrl + "/admin/content"

  def parseId(json: JsValue): Option[String] = {
    (json \ "data" \ "id") match {
       case JsString(id) => Some(id)
       case  _ => None
     }

  }
}
