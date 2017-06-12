package controllers

import com.gu.workflow.api.{CommonAPI, PrototypeAPI}
import models.Stub
import models.api.{ApiResponseFt, _}
import play.api.libs.json.Writes
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

object ContentApi extends Controller with PanDomainAuthActions with WorkflowApi {

  implicit val flatStubWrites = Writes.OptionWrites(Stub.flatStubWrites)

  def contentById(id: String) =  CORSable(composerUrl) {
    APIAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- Try(id.toLong).toOption match {
          case Some(l) => contentByStubId(l)
          case None => contentByComposerId(id)
        }
      } yield {
        item
      })
    }
  }

  private def contentByStubId(id: Long): ApiResponseFt[Option[Stub]] =  {
    val item = PrototypeAPI.getStub(id)
    prepareResponse(item)
  }

  def contentByComposerId(id: String): ApiResponseFt[Option[Stub]] =  {
    val item = CommonAPI.getStubsByComposerId(id)
    prepareResponse(item)
  }

  def contentByEditorId(id: String) = APIAuthAction.async {
    val item = CommonAPI.getStubsByEditorId(id)
    ApiResponseFt[Option[Stub]](prepareResponse(item))
  }

  private def prepareResponse(res: ApiResponseFt[Option[Stub]]): ApiResponseFt[Option[Stub]] = {
    res.flatMap {
      case Some(item) => ApiResponseFt.Right(Some(item))
      case None => ApiResponseFt.Left(ApiErrors.notFound)
    }
  }
}
