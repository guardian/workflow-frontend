package models

import org.joda.time.DateTime

case class Bundle(name: String, items: List[PlannedItem])

case class PlannedItem(title: String, newsList: String, plannedDate: Option[DateTime], notes: Option[String]=None, created: DateTime = DateTime.now(), byLine: String, priority: Int=0)
object PlannedItem {
  implicit val plannedItemFormats = Json.format[PlannedItem]
}
