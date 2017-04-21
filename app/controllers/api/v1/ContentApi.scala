package controllers

import com.gu.workflow.api.{CommonAPI, PrototypeAPI}
import models.Stub
import models.api._
import play.api.Logger
import models.api.ApiResponseFt
import play.api.libs.json.{Json, Writes}
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try


object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {


  def contentById(id: String) =  CORSable(composerUrl) {
    implicit val flatStubWrites = Stub.flatStubWrites
    APIAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- Try(id.toLong).toOption match {
          case Some(l) => contentByStubId(l)
          case None => contentByComposerId(id)
        }
      } yield {
        item
      })(Writes.OptionWrites(Stub.flatStubWrites), global)
    }
  }

  def contentByStubId(id: Long) =  {
    val item = PrototypeAPI.getContentByStubId(id)
    prepareResponse(item)
  }

  def contentByComposerId(id: String) =  {
    val item = CommonAPI.getContentByComposerId(id)
    prepareResponse(item)
  }

  def prepareResponse(res: ApiResponseFt[Option[Stub]]): ApiResponseFt[Option[Stub]] = {
    res.flatMap { contentOpt =>
      contentOpt match {
        case Some(item) => ApiResponseFt.Right(Some(item))
        case None => ApiResponseFt.Left(ApiErrors.notFound)
      }
    }
  }
}
