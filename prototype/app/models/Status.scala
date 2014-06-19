package models

import play.api.libs.json._
import lib.StatusDatabase
import play.api.libs.json.JsString

case class Status(name: String) {
  override def toString = name
}

object Status {
  implicit val statusWrites = new Writes[Status] {
    override def writes(status: Status) = JsString(status.name)
  }

  implicit val statusReads = new Reads[Status] {
    override def reads(json: JsValue) = {
      (json \ "status").validate[String].map(Status(_))
    }
  }
  def Stub = StatusDatabase.get("Stub")
  def Writers = StatusDatabase.get("Writers")
  def Subs = StatusDatabase.get("Subs")
  def Revise = StatusDatabase.get("Revise")
  def Final = StatusDatabase.get("Final")
}
