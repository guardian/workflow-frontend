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

case class PlanView(bundles: List[Bundle], plannedItems: List[PlannedItem])
object PlanView {
  implicit val planVieFormats = Json.format[PlanView]
}

object StubData {
  val all = List(
    PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Carney", Some("BoE Foreign Exchange Investigation")),
    PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Brown", Some("- commentary: Tom Service (tbc - Liese commissioning)")),
    PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 0, 0)), "Amelia Hill", Some("11am launch - the multi agency team now tackling this issue ")),
    PlannedItem("Scarlett Johansson denies", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Some"),
    PlannedItem("Hollywoods creepy uncle", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Someone else")
  )
}

object BundleData {
  val all = List(
    Bundle(
      "Creepy John Travolta",
      StubData.all.slice(3,5)
    ),
    Bundle(
      "Another Bundle",
      StubData.all.slice(0,2)
    )
  )
}

object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

  val bundles:  Agent[List[Bundle]]      = Agent(BundleData.all)
  val items:    Agent[List[PlannedItem]] = Agent(StubData.all)

  val planView: Agent[PlanView]          = Agent(PlanView(bundles(), items()))
}
