package controllers

import com.gu.workflow.api.{CommonAPI, PrototypeAPI}
import models.Stub
import models.api.{ApiResponseFt, _}
import play.api.libs.json.Writes
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

  private def contentByStubId(id: Long): ApiResponseFt[Option[Stub]] =  {
    val item = PrototypeAPI.getStub(id)
    prepareResponse(item)
  }

  private def contentByComposerId(id: String): ApiResponseFt[Option[Stub]] =  {
    val item = CommonAPI.getStubsByComposerId(id)
    prepareResponse(item)
  }

  private def prepareResponse(res: ApiResponseFt[Option[Stub]]): ApiResponseFt[Option[Stub]] = {
    res.flatMap {
      case Some(item) => ApiResponseFt.Right(Some(item))
      case None => ApiResponseFt.Left(ApiErrors.notFound)
    }
  }
}
