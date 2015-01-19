package models

import play.api.libs.json._
import play.api.mvc.{Results, Result}


case class ApiError(message: String, friendlyMessage: String, statusCode: Int, statusString: String, data: Option[JsObject] = None)

case object ApiError {
  implicit val apiErrorFormat = Json.format[ApiError]
}

object ApiErrors {
  lazy val notFound                  = ApiError("ContentNotFound", "Content does not exist", 404, "notfound")
  lazy val invalidContentSend        = ApiError("InvalidContentType", "could not read json from the request", 400, "badrequest")

  def jsonParseError(errMsg: String) = ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")
  def updateError(id: Long)          = ApiError("UpdateError", s"Item with ID, ${id} does not exist", 404, "notfound")
  def composerIdNotFound(id: String) = ApiError("ComposerIdNotFound", s"Composer Id ${id} does not exist in workflow", 404, "notfound")
}


object Response extends Results {
  type Response[T] = Either[ApiError, T]

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
}
