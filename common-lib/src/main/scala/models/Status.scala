package models

import enumeratum.EnumEntry.CapitalWords
import enumeratum._

sealed trait Status extends EnumEntry with CapitalWords
case object Status extends Enum[Status] with CirceEnum[Status] {
  case object Writers extends Status
  case object Desk extends Status
  case object ProductionEditor extends Status
  case object Subs extends Status
  case object Revise extends Status
  case object Killed extends Status
  case object Final extends Status
  case object Finalled extends Status
  case object Hold extends Status

  val values = findValues
}
