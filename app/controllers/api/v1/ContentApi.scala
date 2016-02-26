package controllers

import lib._
import com.gu.workflow.db.{CommonDB}
import models._
import play.api.mvc._
import lib.DBToAPIResponse._

import scala.util.Try


object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  def contentById(id: String) =  CORSable(composerUrl) {
    APIAuthAction { request =>
      Try(id.toLong).toOption match {
        case Some(l) => contentByStubId(l)
        case None => contentByComposerId(id)
      }
    }
  }

  def contentByStubId(id: Long): Result =  {
    val contentOpt: Option[ContentItem] = PostgresDB.getContentById(id)

    Response(contentOpt match {
      case Some(contentItem) => Right(ApiSuccess(contentItem))
      case None => Left(ApiErrors.notFound)
    })
  }

  def contentByComposerId(id: String) =  {
    val contentOpt: Option[ContentItem] = CommonDB.getContentByCompserId(id)

    val contentEither = contentOpt match {
      case Some(contentItem) =>
        contentItem.stub.id.map { id => Right(ApiSuccess(contentItem))}.getOrElse(Left(ApiErrors.notFound))
      case None => Left(ApiErrors.notFound)
    }
		Response(contentEither)
  }



}
