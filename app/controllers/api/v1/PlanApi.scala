package controllers

import models._
import play.api.mvc._
import lib._

import scala.util.{Failure, Success}

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {

  import scala.concurrent.ExecutionContext.Implicits.global
  def plan() = APIAuthAction.async { request =>
    ApiResponseFt(for {
      items <- PlanDB.getItems()
    } yield {
      items
    })

  }

  def items() = APIAuthAction { request =>
    val list = PlanDB.items()
    Response(Right(ApiSuccess(list)))
  }

  def createItem() = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequest(request.body).right
      plannedItem <- extract[PlannedItem](jsValue.data).right
      itemId <- PlanDB.addItem(plannedItem.data).right
    } yield {
      itemId
    })
  }

  def bundles() = APIAuthAction { request =>
    val list = PlanDB.bundles()

    Response(Right(ApiSuccess(list)))
  }
}
