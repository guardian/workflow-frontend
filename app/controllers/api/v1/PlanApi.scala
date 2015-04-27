package controllers

import org.joda.time.DateTime
import com.gu.workflow.db.{PlannedItemDB, NewsListDB, PlannedItemQuery, BundleDB}
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
      items <- queryDataToResponse(PlannedItemDB.getPlannedItemsByQuery(planQuery), "Could not fetch plan items").right
    } yield {
      items
    })
  }

  def queryDataToResponse[T](data: Option[T], errorMessage: String): Response[T] = {
    data match {
      case Some(data) => Right(ApiSuccess(data))
      case None => Left(ApiError(errorMessage, errorMessage, 500, "Error"))
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
      plannedItem <- queryDataToResponse(PlannedItemDB.getPlannedItemById(plannedItemQuery.data.id), "Could not fetch plan items").right
    } yield {
      plannedItem
    })
  }

  def addPlannedItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- queryDataToResponse(PlannedItemDB.upsert(plannedItem.data), "Could not add plan item").right
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
      itemId <- queryDataToResponse(BundleDB.upsert(bundle.data), "Could not add bundle").right
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

}
