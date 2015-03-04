package controllers

import models._
import play.api.mvc._
import lib.{ApiErrors, ApiSuccess, Response, PostgresDB}
import Response.Response

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {
  def plan() = APIAuthAction { request =>
    val list = PlanDB.planView()
    Response(Right(ApiSuccess(list)))
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
