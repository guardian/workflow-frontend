package models

import play.api.libs.json._
import play.api.mvc.{Results, Result}


case class ApiError(message: String, friendlyMessage: String, statusCode: Int, statusString: String)

case object ApiError {
  implicit val apiErrorFormat = Json.format[ApiError]
}



object ApiResponse extends Results {
  type ApiResponse[T] = Either[ApiError, T]

  def apply[T](action: => ApiResponse[T])(implicit tjs: Writes[T]): Result = {
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
