package models

import enumeratum.EnumEntry.CapitalWords
import enumeratum._

sealed trait OctopusStatus extends EnumEntry with CapitalWords

case object OctopusStatus extends Enum[OctopusStatus] with CirceEnum[OctopusStatus] {

  case object Writers extends OctopusStatus
  case object Desk extends OctopusStatus
  case object ChiefSub extends OctopusStatus
  case object Subs extends OctopusStatus
  case object ReviseSub extends OctopusStatus
  case object Finalled extends OctopusStatus
  case object Hold extends OctopusStatus
  case object Killed extends OctopusStatus

  override def values = findValues
}
