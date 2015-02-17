package lib

import play.api.libs.json._
import play.api.mvc.{Result, Results}

case class ApiError(message: String, friendlyMessage: String, statusCode: Int, statusString: String, data: Option[JsObject] = None)

case class ApiSuccess[T](data: T, status: String = "Ok", statusCode: Int = 200, headers: List[(String,String)]= Nil)

case object ApiError {
  implicit val apiErrorFormat = Json.format[ApiError]
}

object ApiErrors {
  lazy val composerUrl = PrototypeConfiguration.cached.composerUrl
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


object Response extends Results {
  type Response[T] = Either[ApiError, ApiSuccess[T]]

  def apply[T](action: => Response[T])(implicit tjs: Writes[T]): Result = {
    action.fold({
      apiError => Status(apiError.statusCode) {
        JsObject(Seq(
          "status" -> JsString(apiError.statusString),
          "statusCode" -> JsNumber(apiError.statusCode),
          "error" -> Json.toJson(apiError)
        ))
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
