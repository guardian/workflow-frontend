package models

import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._


case class LifecycleEvent(
  composerId: String,
  managedByComposer: Boolean,
  event: String,
  eventTime: DateTime
)

object LifecycleEvent {
  implicit val lifecycleEventReads: Reads[LifecycleEvent] = (
    (__ \ "composerId").read[String] ~
    (__ \ "managedByComposer").read[Boolean] ~
    (__ \ "event").read[String] ~
    (__ \ "eventTime").read[Long].map(t => new DateTime(t))
  )(LifecycleEvent.apply _)
}
