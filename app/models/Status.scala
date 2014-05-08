package models

import play.api.libs.json.{JsString, Writes}
import lib.StatusDatabase

case class Status(name: String) {
  override def toString = name
}

object Status {
  implicit val status = new Writes[Status] {
    override def writes(status: Status) = JsString(status.name)
  }

  def Stub = StatusDatabase.get("Stub")
  def Writers = StatusDatabase.get("Writers")
  def Subs = StatusDatabase.get("Subs")
  def Revise = StatusDatabase.get("Revise")
  def Final = StatusDatabase.get("Final")
}
