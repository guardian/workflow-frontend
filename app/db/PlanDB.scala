package models

import java.util.UUID

import akka.agent.Agent
import com.gu.workflow.db.CommonDB
import com.gu.workflow.query.{WfQueryTime, WfQuery}
import com.gu.workflow.query.WfQuery._
import controllers.Api._
import lib.Response.Response
import lib.Response.Response
import lib.Responses._
import org.joda.time.DateTime
import play.api.db.slick._
import play.api.libs.json._
import lib.{ApiError, Response, ApiResponseFt, ApiSuccess}
import play.api.mvc.{AnyContent, Request}
import com.gu.workflow.db.Schema._
import play.api.Play.current
import play.api.db.slick.DB
import scala.slick.driver.PostgresDriver.simple._
import play.api.libs.functional.syntax._
import play.api.libs.json.util._

import scala.concurrent.Future

case class PlannedItem(
                        title: String,
                        newsList: String,
                        plannedDate: DateTime,
                        byLine: Option[String]=None,
                        bundleId: Option[String]=None,
                        notes: Option[String]=None,
                        created: DateTime = DateTime.now(),
                        priority: Int=0,
                        id: Long
                        )

object PlannedItem {

  implicit val plannedItemFormats = Json.writes[PlannedItem]

  implicit val jsonReads: Reads[PlannedItem] =(
    (__ \ "title").read[String] and
    (__ \ "newsList").read[String] and
    (__ \ "plannedDate").read[DateTime] and
    (__ \ "byLine").readNullable[String] and
    (__ \ "bundleId").readNullable[String] and
    (__ \ "notes").readNullable[String] and
    (__ \ "created").readNullable[DateTime].map { dateOpt => dateOpt.fold(DateTime.now())(d=>d) } and
    (__ \ "priority").readNullable[Int].map(_.getOrElse(0)) and
    (__ \"id").read[Long]
    )(PlannedItem.apply _)
}

case class NewsList(
                     title: String,
                     id: Int
                     )

object NewsList {

  implicit val newsListFormats = Json.writes[NewsList]

  implicit val jsonReads: Reads[NewsList] =(
      (__ \ "title").read[String] and
      (__ \"id").read[Int]
    )(NewsList.apply _)
}

case class Bundle(name: String, plannedItems: List[PlannedItem])
object Bundle {
  implicit val bundleFormats = Json.format[Bundle]
}


case class PlanView(bundles: List[Bundle], plannedItems: List[PlannedItem])
object PlanView {
  implicit val planVieFormats = Json.format[PlanView]
}

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

object PlanDB {
  import scala.concurrent.ExecutionContext.Implicits.global

//  val bundles:  Agent[List[Bundle]]      = Agent(BundleData.all)
//  val items:    Agent[Map[String, PlannedItem]] = Agent(StubData.all.map(item => (item.id -> item)).toMap)

//  val planView: Agent[PlanView]          = Agent(PlanView(bundles(), items()))


//  def addItem(item: PlannedItem) = {
//    items.send(items => items.updated(item.id, item))
//    Right(ApiSuccess(item.id))
//  }

  def getItems(queryNewsList: Long): Response[List[PlannedItem]] = {
    //ApiResponseFt.Async.Right(items.future().map(_.values.toList))
    Right(ApiSuccess(getPlannedItems(queryNewsList)))
  }

//  def getStubs(query: WfQuery): List[Stub] =
//    DB.withTransaction { implicit session =>
//      val q = if (unlinkedOnly)
//        stubsTextSearchQuery(stubsQuery(query), query).filter(_.composerId.isEmpty)
//      else
//        stubsQuery(query)
//      q.sortBy(s => (s.priority.desc, s.workingTitle)).list.map(row => Stub.fromStubRow(row))
//    }

  def getPlannedItems(queryNewsList: Long): List[PlannedItem] = DB.withTransaction { implicit session =>
      planItems.filter(_.news_list === queryNewsList).list.map({
        case (id, title, newsList, date) => PlannedItem(title, newsList.toString, date, None, None, None, new DateTime().withTime(11, 0, 0, 0), 0, id)
      })
    }

  def createPlannedItem(planItem: PlannedItem) = {
    DB.withTransaction { implicit session =>
      val planItemExists = planItems.filter(_.title === planItem.title).exists.run
      if(!planItemExists) {
        planItems += (0, planItem.title, planItem.newsList.toLong, planItem.plannedDate)
        Right(ApiSuccess(planItem.id))
      }
      else Left(ApiError("Could not create planned item", "Could not create planned item", 500, "Error"))
    }
  }

  def getNewsLists(): List[NewsList] = DB.withTransaction { implicit session =>
    newsLists.list.map({
      case (pk, title) => NewsList(title, pk.toInt)
    })
  }
}
