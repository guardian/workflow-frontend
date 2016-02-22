package lib

import play.api.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Results}

import scala.concurrent.{ExecutionContext, Future}
import config.Config

case class ApiError(message: String, friendlyMessage: String, statusCode: Int, statusString: String, data: Option[JsObject] = None)

case class ApiSuccess[T](data: T, status: String = "Ok", statusCode: Int = 200, headers: List[(String,String)]= Nil)

case object ApiError {
  implicit val apiErrorFormat = Json.format[ApiError]
}

object ApiErrors {
  lazy val composerUrl = Config.composerUrl
  lazy val notFound                  = ApiError("ContentNotFound", "Content does not exist", 404, "notfound")
  lazy val invalidContentSend        = ApiError("InvalidContentType", "could not read json from the request", 400, "badrequest")
  lazy val conflict                  = ApiError("WorkflowContentExists", s"This item is already tracked in Workflow", 409, "conflict")

  def jsonParseError(errMsg: String) = ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")
  def updateError(id: Long)          = ApiError("UpdateError", s"Item with ID, ${id} does not exist", 404, "notfound")
  def composerIdNotFound(id: String) = ApiError("ComposerIdNotFound", s"Composer Id ${id} does not exist in workflow", 404, "notfound")
  def databaseError(exc: String)     = ApiError("DatabaseError", s"${exc}", 500, "internalservererror")

  def composerItemLinked(id: Long, composerId: String) = {
    ApiError("ComposerItemIsLinked", s"This stub is already linked to a composer article", 409, "conflict",
      Some(
        Json.obj(
          "stubId" -> JsNumber(id),
          "composerId" -> JsString(composerId)
        )
      )
    )
  }

}



case class ApiResponseFt[A] private (underlying: Future[Either[ApiError, A]]) {

  def map[B](f: A => B)(implicit ec: ExecutionContext): ApiResponseFt[B] = ApiResponseFt(underlying.map(ft => ft.right.map(a => f(a))))

  def flatMap[B](f: A => ApiResponseFt[B])(implicit ec: ExecutionContext): ApiResponseFt[B] = ApiResponseFt {
    asFuture.flatMap {
      case Right(a) => f(a).asFuture
      case Left(e) => Future.successful(Left(e))
    }
  }

  def fold[B](failure: ApiError => B, success: A => B)(implicit ex: ExecutionContext): Future[B] = {
    asFuture.map(_.fold(failure, success))
  }

  def asFuture(implicit ec: ExecutionContext): Future[Either[ApiError, A]] = {
    underlying recover { case err =>
      scala.Left(ApiError("DatabaseError",err.getMessage,500, "server"))
    }
  }

}

object ApiResponseFt extends Results {

  def apply[T](action: => ApiResponseFt[T])(implicit tjs: Writes[T], ec: ExecutionContext): Future[Result] = {
    action.fold( {
      apiErrors => Status(apiErrors.statusCode) {
        JsObject(Seq(
          "status" -> JsString("error"),
          "statusCode" -> JsNumber(apiErrors.statusCode),
          "data" -> JsArray(),
          "errors" -> Json.toJson(apiErrors)
        ))
      }
    },
    t => {
      Ok {
        JsObject(Seq(
          "status" -> JsString("ok"),
          "statusCode" -> JsNumber(200),
          "data" -> Json.toJson(t)
        ))
      }
    })
  }

  def Right[A](a: A): ApiResponseFt[A] = ApiResponseFt(Future.successful(scala.Right(a)))

  def Left[A](err: ApiError): ApiResponseFt[A] = ApiResponseFt(Future.successful(scala.Left(err)))

  object Async {
    def Right[A](fa: Future[A])(implicit ex: ExecutionContext): ApiResponseFt[A] = ApiResponseFt(fa.map(scala.Right(_)))

    def Left[A](ferr: Future[ApiError])(implicit ec: ExecutionContext): ApiResponseFt[A] = ApiResponseFt(ferr.map(scala.Left(_)))
  }

}

object Response extends Results {
  type Response[T] = Either[ApiError, ApiSuccess[T]]

  def apply[T](action: => Response[T])(implicit tjs: Writes[T]): Result = {
    action.fold({
      apiError => {
        Logger.info(apiError.friendlyMessage)
        Status(apiError.statusCode) {
          JsObject(Seq(
            "status" -> JsString(apiError.statusString),
            "statusCode" -> JsNumber(apiError.statusCode),
            "error" -> Json.toJson(apiError)
          ))
        }
      }
    },
    apiSuccess => {
      Status(apiSuccess.statusCode) {
        JsObject(Seq(
          "status" -> JsString(apiSuccess.status),
          "statusCode" -> JsNumber(apiSuccess.statusCode),
          "data" -> Json.toJson(apiSuccess.data)
        ))
      }.withHeaders(apiSuccess.headers:_*)
    })
  }
}
