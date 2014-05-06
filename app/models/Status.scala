package models

import play.api.libs.json.{JsString, Writes}

case class Status(name: String)

object Status {
  implicit val status = new Writes[Status] {
    override def writes(status: Status) = JsString(status.name)
  }
}
