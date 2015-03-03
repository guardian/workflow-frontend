package controllers

import models._
import lib.PlanDB
import play.api.mvc._
import lib.{ApiErrors, ApiSuccess, Response, PostgresDB}
import Response.Response

object PlanApi extends Controller with PanDomainAuthActions with WorkflowApi {
  def plan() = APIAuthAction { request =>
    val list = PlanDB.store()

    Response(Right(ApiSuccess(list)).right)
  }
}
