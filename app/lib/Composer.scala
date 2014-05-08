package lib

import play.api.libs.json.{JsString, JsValue}

object Composer {

  def parseId(json: JsValue): Option[String] = {
     json \ "data" \ "id" match {
       case JsString(id) => Some(id)
       case  _ => None
     }

  }
}
