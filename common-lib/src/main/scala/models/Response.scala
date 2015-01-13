package models

import play.api.libs.json._
import play.api.mvc.{Results, Result}


case class ApiError(message: String, friendlyMessage: String, statusCode: Int, statusString: String)

case object ApiError {
  implicit val apiErrorFormat = Json.format[ApiError]
}

object ApiErrors {
  lazy val notFound = new ApiError("ContentNotFound", "Content does not exist", 404, "notfound")
  lazy val invalidContentSend = new ApiError("InvalidContentType", "could not read json from the request", 400, "badrequest")
  def jsonParseError(errMsg: String) = new ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")
}


object Response extends Results {
  type Response[T] = Either[ApiError, T]

  def apply[T](action: => Response[T])(implicit tjs: Writes[T]): Result = {
    action.fold({
      apiError => Status(apiError.statusCode) {
        JsObject(Seq(
          "status" -> JsString(apiError.statusString),
          "statusCode" -> JsNumber(apiError.statusCode),
          "data" -> JsArray(),
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
