package lib

import akka.agent.Agent
import org.joda.time.DateTime
import play.api.libs.json._

case class PlannedItem(title: String, newsList: String, plannedDate: Option[DateTime], byLine: String, notes: Option[String]=None, created: DateTime = DateTime.now(),  priority: Int=0)
object PlannedItem {
  implicit val plannedItemFormats = Json.format[PlannedItem]
}

case class Bundle(name: String, plannedItems: List[PlannedItem])

object Bundle {
  implicit val bundleFormats = Json.format[Bundle]
}



object StubData {
  val itemOne = PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Carney", Some("BoE Foreign Exchange Investigation"))
  val itemTwo = PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Brown", Some("- commentary: Tom Service (tbc - Liese commissioning)"))
  val itemThree = PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 0, 0)), "Amelia Hill", Some("11am launch - the multi agency team now tackling this issue "))
  val all = List(itemOne, itemTwo, itemThree)
}

object BundleData {
  val itemOne = PlannedItem("Scarlett Johansson denies", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Some")
  val itemTwo = PlannedItem("Hollywoods creepy uncle", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Someone else")

  val bundles = Bundle("Creepy John Travolta", List(itemOne, itemTwo))

}

object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

  val bundles: Agent[List[Bundle]] = Agent(List(BundleData.bundles))

  val store: Agent[List[PlannedItem]] = Agent(StubData.all)
}
