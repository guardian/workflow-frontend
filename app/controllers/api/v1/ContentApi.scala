package controllers

import com.gu.workflow.api.{ CommonAPI, PrototypeAPI }
import com.gu.workflow.db.{CommonDB}
import models.ContentItem
import models.api._
import play.api.Logger
import models.api.ApiResponseFt
import play.api.libs.json.Json
import play.api.mvc._
import scala.concurrent.ExecutionContext.Implicits.global

import scala.util.Try


object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  def contentById(id: String) =  CORSable(composerUrl) {
    APIAuthAction.async {
      val item = Try(id.toLong).toOption match {
        case Some(l) => contentByStubId(l)
        case None => contentByComposerId(id)
      }
      item
    }
  }

  def contentByStubId(id: Long) =  {
    val item = PrototypeAPI.getContentByStubId(id).asFuture
    item.map(prepareResponse(_))
  }

  def contentByComposerId(id: String) =  {
    val item = CommonAPI.getContentByComposerId(id).asFuture
    item.map(prepareResponse(_))
  }

  def prepareResponse(res: Either[ApiError, Option[ContentItem]]) = {
    res match {
      case Left(err) => Ok(Json.toJson(err))
      case Right(item) => item match {
        case Some(i) => Ok(Json.toJson(i))
        case None => Ok(Json.toJson(ApiErrors.notFound))
      }
    }
  }
}
