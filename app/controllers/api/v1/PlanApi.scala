package controllers

import org.joda.time.DateTime
import com.gu.workflow.db._
import controllers.Admin._
import lib.Response.Response
import models._
import play.api.data.Form
import play.api.data.Forms._
import play.api.libs.json.{JsResult, Reads, JsValue}
import play.api.mvc._
import lib._

import scala.util.{Try, Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  // helper methods
  def extractFromJson(fieldName: String, jsValue: JsValue) = {
    val jsValueData = jsValue \ "data"
    fieldName match {
      case "title"|"note" => extract[String](jsValueData)
      case "byLine"|"notes"|"composerId" => extract[Option[String]](jsValueData)
      case "newsList"|"bundleId" => extract[Long](jsValueData)
      case "priority" => extract[Int](jsValueData)
      case "plannedDate"|"created"|"day" =>
        // this could possibly be improved by replacing with a custom reads
        val dateString = extract[String](jsValueData).right.map { d => d.data}.right.getOrElse("")
        Try(new DateTime(dateString)) match {
          case Success(dt) => Right(ApiSuccess(dt))
          case Failure(msg) => Left(ApiError("Could not parse date", "Could not parse date", 500, "Error"))
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

  /** Plan item queries */

  def plan(newsListIdOption: Option[Long], startDateOption: Option[String], endDateOption: Option[String]) = APIAuthAction { implicit request =>

    val planQuery = PlannedItemQuery(newsListIdOption, startDateOption.map(d => DateTime.parse(d)), endDateOption.map(d => DateTime.parse(d)))

    Response(for {
      items <- queryDataToResponse(PlannedItemDB.getPlannedItemsByQuery(planQuery), "Could not fetch plan items").right
    } yield {
      items
    })
  }

  def getPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItemQuery <- extract[PlannedItem](jsValue.data).right
      plannedItem <- queryDataToResponse(PlannedItemDB.getPlannedItemById(plannedItemQuery.data.id), "Could not fetch plan items").right
    } yield {
      plannedItem
    })
  }

  def addPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.insert(plannedItem.data), "Could not add plan item").right
    } yield {
      itemId
    })
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
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.deletePlannedItem(plannedItem.data), "Could not delete plan item").right
    } yield {
      itemId
    })
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
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      bundle <- extract[Bundle](jsValue.data).right
      itemId <- queryDataToResponse(BundleDB.insert(bundle.data), "Could not add bundle").right
    } yield {
        itemId
      })
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

  def deleteBundle = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      bundle <- extract[Bundle](jsValue.data).right
      itemId <- queryDataToResponse(BundleDB.deleteBundle(bundle.data), "Could not delete bundle").right
    } yield {
        itemId
      })
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

  def addDayNote = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      dayNote <- extract[DayNote](jsValue.data).right
      itemId <- queryDataToResponse(DayNoteDB.insert(dayNote.data), "Could not add day note").right
    } yield {
        itemId
      })
  }

  def patchDayNote(id: Long, fieldName: String) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      newFieldValue <- extractFromJson(fieldName, jsValue.data).right
      itemId <- queryDataToResponse(DayNoteDB.update(id, fieldName, newFieldValue.data), "Could not update day note").right
    } yield {
        itemId
      })
  }

  def deleteDayNote = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      dayNote <- extract[DayNote](jsValue.data).right
      itemId <- queryDataToResponse(DayNoteDB.deleteDayNote(dayNote.data), "Could not delete day note").right
    } yield {
        itemId
      })
  }

}
