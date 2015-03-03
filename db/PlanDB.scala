import akka.agent.Agent
import models.PlannedItem
import org.joda.time.DateTime

case class PlannedItem(title: String, newsList: String, plannedDate: Option[DateTime], byLine: String, notes: Option[String]=None, created: DateTime = DateTime.now(),  priority: Int=0)


object StubData {
  val itemOne = PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 00, 00)), "Mark Carney", Some(" BoE Foreign Exchange Investigation"))
  val itemTwo = PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 00, 00)), "Mark Brown", Some("- commentary: Tom Service (tbc - Liese commissioning)"))
  val itemThree = PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 00, 00)), "Amelia Hill", Some("11am launch - the multi agency team now tackling this issue "))

  val all = List(itemOne, itemTwo, itemThree)
}

object PlanDB {

  val store: Agent[List[PlannedItem]] = Agent(StubData.all)


}
