package models

import akka.agent.Agent
import org.joda.time.DateTime
import play.api.libs.json._
import lib.{ApiSuccess}

case class PlannedItem(title: String, newsList: String, plannedDate: Option[DateTime], byLine: String, bundleId: Option[String]=None, notes: Option[String]=None, created: DateTime = DateTime.now(),  priority: Int=0)
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
    PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Carney", Some("BoE Foreign Exchange Investigation"), Some("Another Bundle")),
    PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), "Mark Brown", Some("- commentary: Tom Service (tbc - Liese commissioning)"), Some("Another Bundle")),
    PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 0, 0)), "Amelia Hill", Some("11am launch - the multi agency team now tackling this issue "), Some("Creepy John Travolta")),
    PlannedItem("Scarlett Johansson denies", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Some", Some("Creepy John Travolta")),
    PlannedItem("Hollywoods creepy uncle", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), "Someone else", Some("Creepy John Travolta")),
    PlannedItem("Overnight curtain-raiser", "news", None, "Dan R", Some("Obama in Saudi Arabia"), Some(" to be launched by AUS - UK to pick up and expand, then US to take over")),
    PlannedItem("Further analysis", "news",  Some(new DateTime().withTime(15, 30, 0, 0)), "Aitken", Some("Obama in Saudi Arabia"), None),
    PlannedItem("Litvenenko inquest opens", "news", Some(new DateTime().withTime(15, 30, 0, 0)), "LH", Some("Litvenenko inquest opens")),
    PlannedItem("Video explainer", "news", Some(new DateTime().withTime(11, 0, 0, 0)), "na", Some("Litvenenko inquest opens")),
    PlannedItem("Live blog", "news", Some(new DateTime().withTime(10, 0, 0,0)), "Walker", Some("Litvenenko inquest opens"))
  )
}


object BundleData {
  val all = List(
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
      List()
    )
  )

}

object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

  val bundles:  Agent[List[Bundle]]      = Agent(BundleData.all)
  val items:    Agent[List[PlannedItem]] = Agent(StubData.all)

  val planView: Agent[PlanView]          = Agent(PlanView(bundles(), items()))


  def addItem(item: PlannedItem) = {
    items.send(_ :+ item)


    Right(ApiSuccess("id"))
  }
}
