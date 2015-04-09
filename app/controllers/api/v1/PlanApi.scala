package controllers

import com.google.api.client.util.DateTime
import com.gu.workflow.db.{PlannedItemDB, NewsListDB}
import controllers.Admin._
import lib.Response.Response
import models._
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import lib._

import scala.util.{Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  import scala.concurrent.ExecutionContext.Implicits.global
  def plan(queryNewsListOption: Option[Long]) = APIAuthAction { implicit request =>

    val queryNewsList: Long = queryNewsListOption.getOrElse(0)

    Response(for {
      items <- PlanDB.getItems(queryNewsList).right
    } yield {
      items
    })

  }

//  def items() = APIAuthAction { request =>
//    val list = PlanDB.items()
//    Response(Right(ApiSuccess(list)))
//  }

  def items() = APIAuthAction { implicit request =>

    println("getting items")

    Response(for {
      items <- PlanDB.getItems(0).right
    } yield {
      items
    })

  }

  def queryDataToResponse[T](data: Option[T]): Response[T] = {
    data match {
      case Some(id) => Right(ApiSuccess(id))
      case None => Left(ApiError("Could not create planned item", "Could not create planned item", 500, "Error"))
    }
  }

  def plannedItemQueryDataToResponse(planData: PlannedItem): Response[Long] = {
    PlannedItemDB.upsert(planData) match {
      case Some(id) => Right(ApiSuccess(id))
      case None => Left(ApiError("Could not create planned item", "Could not create planned item", 500, "Error"))
    }
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
