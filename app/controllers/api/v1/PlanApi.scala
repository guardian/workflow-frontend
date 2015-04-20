package controllers

import org.joda.time.DateTime
import com.gu.workflow.db.{PlannedItemDB, NewsListDB, PlannedItemQuery}
import controllers.Admin._
import lib.Response.Response
import models._
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import lib._

import scala.util.{Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  def plan(newsListIdOption: Option[Long], startDateOption: Option[String], endDateOption: Option[String]) = APIAuthAction { implicit request =>

    val planQuery = PlannedItemQuery(newsListIdOption, startDateOption.map(d => DateTime.parse(d)), endDateOption.map(d => DateTime.parse(d)))

    Response(for {
      items <- queryDataToResponse(PlannedItemDB.getPlannedItemsByQuery(planQuery)).right
    } yield {
      items
    })
  }

  def queryDataToResponse[T](data: Option[T]): Response[T] = {
    data match {
      case Some(data) => Right(ApiSuccess(data))
      case None => Left(ApiError("Could not fetch plan items", "Could not fetch plan items", 500, "Error"))
    }
  }

  def plannedItemQueryDataToResponse(planData: PlannedItem): Response[Long] = {
    PlannedItemDB.upsert(planData) match {
      case Some(id) => Right(ApiSuccess(id))
      case None => Left(ApiError("Could not fetch plan items", "Could not fetch plan items", 500, "Error"))
    }
  }

  def getPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItemQuery <- extract[PlannedItem](jsValue.data).right
      plannedItem <- queryDataToResponse(PlannedItemDB.getPlannedItemById(plannedItemQuery.data.id)).right
    } yield {
      plannedItem
    })
  }

  def addPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.upsert(plannedItem.data)).right
    } yield {
      itemId
    })
  }

  def deletePlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.deletePlannedItem(plannedItem.data)).right
    } yield {
      itemId
    })
  }

//  def bundles() = APIAuthAction { request =>
//    val list = PlanDB.bundles()
//
//    Response(Right(ApiSuccess(list)))
//  }
}
