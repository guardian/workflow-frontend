package controllers

import com.gu.pandomainauth.action.UserRequest
import org.joda.time.DateTime
import com.gu.workflow.db._
import lib.Response.Response
import models._
import play.api.libs.json._
import play.api.mvc._
import lib._

import scala.util.{Try, Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  // helper methods
  def extractFromJson[T](fieldName: String, jsValue: JsValue) = {
    val jsValueData = jsValue \ "data"
    fieldName match {
      case "title"|"note" => extract[String](jsValueData)
      case "byLine"|"notes"|"composerId" => extract[Option[String]](jsValueData)
      case "newsList"|"bundleId" => extract[Long](jsValueData)
      case "priority" => extract[Int](jsValueData)
      case "plannedDate"|"created"|"day" =>
        // this could possibly be improved by replacing with a custom reads
        val dateString = extract[String](jsValueData).right.map { d => d.data}.right.getOrElse("")
        if (dateString.size > 0) {
          Try(new DateTime(dateString)) match {
            case Success(dt) => Right(ApiSuccess(Some(dt)))
            case Failure(msg) => Left(ApiError("Could not parse date", "Could not parse date", 500, "Error"))
          }
        } else { // An empty datestring > unscheduled item
          Right(ApiSuccess(None))
        }

      case "hasSpecificTime"|"bucketed" => extract[Boolean](jsValueData)
      case _ => Left(ApiError("Invalid field name", "Invalid field name", 500, "Error"))
    }
  }

  def queryDataToResponse[T](data: Option[T], errorMessage: String): Response[T] = {
    data match {
      case Some(data) => Right(ApiSuccess(data))
      case None => Left(ApiError(errorMessage, errorMessage, 500, "Error"))
    }
  }

  def requestToResponse[A :Reads, B](request: UserRequest[AnyContent], dbFunction: A => Option[B], errorMessage: String) = {
    for {
      jsValue <- readJsonFromRequest(request.body).right
      queryData <- extract[A](jsValue.data).right
      out <- queryDataToResponse(dbFunction(queryData.data), errorMessage).right
    } yield {
        out
      }
  }

  /** Plan item queries */

  def plan(newsListIdOption: Option[Long], startDateOption: Option[String], endDateOption: Option[String]) = APIAuthAction { implicit request =>

    val planQuery = PlannedItemQuery(newsListIdOption, startDateOption.map(d => DateTime.parse(d)), endDateOption.map(d => DateTime.parse(d)))

    val items = PlannedItemDB.getPlannedItemsByQuery(planQuery) // List of bundles with items
    val unscheduledItems = PlannedItemDB.getUnscheduledPlannedItems(planQuery) // Flat list of items

    // TODO: Better way to do this?

    val itemsAsJson = JsArray(items.get.map(Json.toJson(_)).toSeq)
    val unscheduledItemsAsJson = JsArray(unscheduledItems.get.map(Json.toJson(_)).toSeq)

    val resultAsJson = Map("plan" -> itemsAsJson, "unscheduled" ->  unscheduledItemsAsJson)

    Response(for {
      response <- queryDataToResponse(Some(resultAsJson), "Could not fetch plan items").right
    } yield {
      response
    })
  }

  def getPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItemQuery <- extract[PlannedItem](jsValue.data).right
      plannedItem <- queryDataToResponse(PlannedItemDB.getPlannedItemById(plannedItemQuery.data), "Could not fetch plan items").right
    } yield {
      plannedItem
    })
  }

  def addPlannedItem() = APIAuthAction { implicit request =>
    Response(requestToResponse[PlannedItem, Long](request,PlannedItemDB.insert, "Could not add plan item"))
  }

  def patchPlannedItem(id: Long, fieldName: String) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      newFieldValue <- extractFromJson(fieldName, jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.update(id, fieldName, newFieldValue.data), "Could not update plan item").right
    } yield {
        itemId
      })
  }

  def deletePlannedItem() = APIAuthAction { implicit request =>
    Response(requestToResponse[PlannedItem, Long](request,PlannedItemDB.deletePlannedItem, "Could not delete plan item"))
  }

  /** Bundle queries */

  def getBundleById(id : Long) = APIAuthAction { implicit request =>
    Response(for {
      bundle <- queryDataToResponse(BundleDB.getBundleById(id), "Could not fetch bundle").right
    } yield {
        bundle
    })
  }

  def getBundles() = APIAuthAction { implicit request =>
    Response(for {
      bundles <- queryDataToResponse(BundleDB.getBundles, "Could not fetch bundles").right
    } yield {
        bundles
      })
  }

  def addBundle() = APIAuthAction { implicit request =>
    Response(requestToResponse[Bundle, Long](request,BundleDB.insert, "Could not add bundle"))
  }

  def patchBundle(id: Long, fieldName: String) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      newFieldValue <- extractFromJson(fieldName, jsValue.data).right
      itemId <- queryDataToResponse(BundleDB.update(id, fieldName, newFieldValue.data), "Could not update bundle").right
    } yield {
        itemId
      })
  }

  def deleteBundle() = APIAuthAction { implicit request =>
    Response(requestToResponse[Bundle, Long](request,BundleDB.deleteBundle, "Could not delete bundle"))
  }

  /** Day note queries. */

  def getDayNoteById(id : Long) = APIAuthAction { implicit request =>
    Response(for {
      dayNote <- queryDataToResponse(DayNoteDB.getDayNoteById(id), "Could not fetch day note").right
    } yield {
        dayNote
      })
  }

  def getDayNotes(newsListIdOption: Option[Long], startDateOption: Option[String], endDateOption: Option[String]) = APIAuthAction { implicit request =>

    val dayNoteQuery = DayNoteQuery(newsListIdOption, startDateOption.map(d => DateTime.parse(d)), endDateOption.map(d => DateTime.parse(d)))

    Response(for {
      items <- queryDataToResponse(DayNoteDB.getDayNotesByQuery(dayNoteQuery), "Could not fetch day notes").right
    } yield {
        items
      })
  }

    def addDayNote() = APIAuthAction { implicit request =>
      Response(requestToResponse[DayNote, Long](request,DayNoteDB.insert, "Could not add day note"))
    }

  def patchDayNote(id: Long, fieldName: String) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      newFieldValue <- extractFromJson(fieldName, jsValue.data).right
      itemId <- queryDataToResponse(DayNoteDB.updateDayNote(id, fieldName, newFieldValue.data), "Could not update day note").right
    } yield {
        itemId
      })
  }

  def deleteDayNote() = APIAuthAction { implicit request =>
    Response(requestToResponse[DayNote, Long](request,DayNoteDB.deleteById, "Could not delete day note"))
  }

}
