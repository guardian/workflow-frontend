package controllers

import com.gu.workflow.api.PrototypeAPI
import lib._
import com.gu.workflow.db.{CommonDB}
import models._
import play.api.Logger
import models.api.ApiResponseFt
import play.api.mvc._
import lib.DBToAPIResponse._
import scala.concurrent.ExecutionContext.Implicits.global

import scala.util.Try


object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  def contentById(id: String) =  CORSable(composerUrl) {
    APIAuthAction.async {
      Try(id.toLong).toOption match {
            case Some(l) => contentByStubId(l)
            case None => contentByComposerId(id)
      }
    }
  }

  def contentByStubId(id: Long) =  {
    ApiResponseFt[Option[ContentItem]](for {
      item <- PrototypeAPI.getContentByStubId(id)
    } yield {
      item
    })
  }

  def contentByComposerId(id: String) =  {
    ApiResponseFt[Option[ContentItem]](for {
      item <- PrototypeAPI.getContentByComposerId(id)
    } yield {
      item
    })
  }



}
