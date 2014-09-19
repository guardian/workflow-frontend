package lib

import play.api.libs.json.{JsString, JsValue}


object Composer {

  //default to localhost for now
  lazy val baseUrl = PrototypeConfiguration.apply.composerUrl
  lazy val newContentUrl = baseUrl + "/api/content"
  lazy val adminUrl = baseUrl + "/content"
  lazy val contentDetails = baseUrl + "/api/content/"

  // XXX TODO this probably doesn't belong in this object (as it's not
  // composer related)
  lazy val presenceUrl = PrototypeConfiguration.apply.presenceUrl

  def parseId(json: JsValue): Option[String] = {
    (json \ "data" \ "id") match {
       case JsString(id) => Some(id)
       case  _ => None
     }

  }
}
