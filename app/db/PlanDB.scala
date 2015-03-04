package lib

import akka.agent.Agent
import org.joda.time.DateTime
import play.api.libs.json._

case class PlannedItem(title: String, newsList: String, plannedDate: Option[DateTime], byLine: String, bundleId: Option[String]=None, notes: Option[String]=None, created: DateTime = DateTime.now(),  priority: Int=0)
object PlannedItem {
  implicit val plannedItemFormats = Json.format[PlannedItem]
}

case class Bundle(name: String, plannedItems: List[PlannedItem])

object Bundle {
  implicit val bundleFormats = Json.format[Bundle]
}

object StubData {
  val all = List(
    PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Carney", Some("BoE Foreign Exchange Investigation"), Some("Another Bundle")),
    PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Brown", Some("- commentary: Tom Service (tbc - Liese commissioning)"), Some("Another Bundle")),
    PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 0, 0)), "Amelia Hill", Some("11am launch - the multi agency team now tackling this issue "), Some("Creepy John Travolta")),
    PlannedItem("Scarlett Johansson denies", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Some", Some("Creepy John Travolta")),
    PlannedItem("Hollywoods creepy uncle", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Someone else", Some("Creepy John Travolta"))
  )
}


object BundleData {
  val all = List(
//    Bundle(
//      "Creepy John Travolta",
//      StubData.all.slice(3,5)
//    ),
//    Bundle(
//      "Another Bundle",
//      StubData.all.slice(0,2)
//    ),
    Bundle(
      "Obama in Saudi Arabia",
      List(
        PlannedItem("Overnight curtain-raiser", "news", None, "Dan R", None, Some(" to be launched by AUS - UK to pick up and expand, then US to take over")),
        PlannedItem("Further analysis", "news", None, "Aitken")
      )
    ),
    Bundle(
      "Auschwitz rememberance",
      List(
        PlannedItem("explainer + video", "news", None, "na" ),
        PlannedItem("curtain-raiser", "news", None, "Connolly" ),
        PlannedItem("interview with survivor", "news", None, "Davies"),
        PlannedItem("Rolling news story", "news", None, "Weaver")
      )
    ),
    Bundle(
      "Litvenenko inquest opens",
      List(
        PlannedItem("Litvenenko inquest opens", "news", Some(new DateTime().withTime(15, 30, 0, 0)), "LH"),
        PlannedItem("Video explainer", "news", Some(new DateTime().withTime(11, 0, 0, 0)), "na"),
        PlannedItem("News curtain raiser", "news", None, "LH"),
        PlannedItem("Live blog", "news", Some(new DateTime().withTime(10, 0, 0,0)), "Walker")
      )
    )
  )

}

object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

  val bundles: Agent[List[Bundle]]      = Agent(BundleData.all)
  val store:   Agent[List[PlannedItem]] = Agent(StubData.all)
}
