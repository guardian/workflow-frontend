//package models
//
//import java.util.UUID
//
//import akka.agent.Agent
//import com.gu.workflow.db.{PlannedItemDB, CommonDB}
//import com.gu.workflow.query.{WfQueryTime, WfQuery}
//import com.gu.workflow.query.WfQuery._
//import controllers.Api._
//import lib.Response
//import lib.{Response, ApiSuccess}
//import Response.Response
//import Response.Response
//import lib.Responses._
//import org.joda.time.DateTime
//import play.api.db.slick._
//import play.api.libs.json._
//import lib.{ApiSuccess, Response}
//import play.api.mvc.{AnyContent, Request}
//import com.gu.workflow.db.Schema._
//import play.api.Play.current
//import play.api.db.slick.DB
//import scala.slick.driver.PostgresDriver.simple._
//import play.api.libs.functional.syntax._
//import play.api.libs.json.util._
//
//import scala.concurrent.Future
//
//import org.joda.time.DateTime
//import play.api.libs.json._
//import play.api.libs.json.Reads._
//
//case class Bundle(name: String, plannedItems: List[PlannedItem])
//object Bundle {
//  implicit val bundleFormats = Json.format[Bundle]
//}
//
//
//case class PlanView(bundles: List[Bundle], plannedItems: List[PlannedItem])
//object PlanView {
//  implicit val planVieFormats = Json.format[PlanView]
//}

//object StubData {
//  val all = List(
//    PlannedItem("MPs quiz", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), Some("Mark Carney"), Some("BoE Foreign Exchange Investigation"), Some("Another Bundle")),
//    PlannedItem("London Symphony Orchestra press conf", "Global", Some(new DateTime(2015, 3, 3, 10, 0, 0)), Some("Mark Brown"), Some("- commentary: Tom Service (tbc - Liese commissioning)"), Some("Another Bundle")),
//    PlannedItem("Serious case review published into failings over the abuse of girls in Oxfordshire - Laville (8am lock in)", "Global", Some(new DateTime(2015, 3, 3, 11, 0, 0)), Some("Amelia Hill"), Some("11am launch - the multi agency team now tackling this issue "), Some("Creepy John Travolta")),
//    PlannedItem("Scarlett Johansson denies", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), Some("Some"), Some("Creepy John Travolta")),
//    PlannedItem("Hollywoods creepy uncle", "Film", Some(new DateTime(2015, 3, 3, 15, 0, 0)), Some("Someone else"), Some("Creepy John Travolta")),
//    PlannedItem("Overnight curtain-raiser", "news", None, Some("Dan R"), Some("Obama in Saudi Arabia"), Some(" to be launched by AUS - UK to pick up and expand, then US to take over")),
//    PlannedItem("Further analysis", "news",  Some(new DateTime().withTime(15, 30, 0, 0)), Some("Aitken"), Some("Obama in Saudi Arabia"), None),
//    PlannedItem("Litvenenko inquest opens", "news", Some(new DateTime().withTime(15, 30, 0, 0)), Some("LH"), Some("Litvenenko inquest opens")),
//    PlannedItem("Video explainer", "news", Some(new DateTime().withTime(11, 0, 0, 0)), None, Some("Litvenenko inquest opens")),
//    PlannedItem("Live blog", "news", Some(new DateTime().withTime(10, 0, 0,0)), Some("Walker"), Some("Litvenenko inquest opens"))
//  )
//}


//object BundleData {
//  val all = List(
//    Bundle(
//      "Obama in Saudi Arabia",
//      List(
//        PlannedItem("Overnight curtain-raiser", "news", None, Some("Dan R"), None, Some(" to be launched by AUS - UK to pick up and expand, then US to take over")),
//        PlannedItem("Further analysis", "news", None, Some("Aitken"))
//      )
//    ),
//    Bundle(
//      "Auschwitz rememberance",
//      List(
//        PlannedItem("explainer + video", "news", None, None),
//        PlannedItem("curtain-raiser", "news", None, Some("Connolly")),
//        PlannedItem("interview with survivor", "news", None, Some("Davies")),
//        PlannedItem("Rolling news story", "news", None, Some("Weaver"))
//      )
//    ),
//    Bundle(
//      "Litvenenko inquest opens",
//      List()
//    )
//  )
//
//}

//object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

//  val bundles:  Agent[List[Bundle]]      = Agent(BundleData.all)
//  val items:    Agent[Map[String, PlannedItem]] = Agent(StubData.all.map(item => (item.id -> item)).toMap)

//  val planView: Agent[PlanView]          = Agent(PlanView(bundles(), items()))


//  def addItem(item: PlannedItem) = {
//    items.send(items => items.updated(item.id, item))
//    Right(ApiSuccess(item.id))
//  }

//  def getItems(queryNewsList: Long): Response[List[PlannedItem]] = {
//    //ApiResponseFt.Async.Right(items.future().map(_.values.toList))
//    Right(ApiSuccess(PlannedItemDB.getPlannedItems(queryNewsList)))
//  }

//  def getStubs(query: WfQuery): List[Stub] =
//    DB.withTransaction { implicit session =>
//      val q = if (unlinkedOnly)
//        stubsTextSearchQuery(stubsQuery(query), query).filter(_.composerId.isEmpty)
//      else
//        stubsQuery(query)
//      q.sortBy(s => (s.priority.desc, s.workingTitle)).list.map(row => Stub.fromStubRow(row))
//    }

//}
