package controllers

import models._
import play.api.mvc._
import lib._

import scala.util.{Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  import scala.concurrent.ExecutionContext.Implicits.global
  def plan() = APIAuthAction { implicit request =>

    println(request);
    Response(for {
      items <- PlanDB.getItems().right
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
      items <- PlanDB.getItems().right
    } yield {
      items
    })

  }

  def createItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- PlanDB.createPlannedItem(plannedItem.data).right
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
