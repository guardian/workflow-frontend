package lib

import play.api.libs.json.{Json, JsValue, Writes}


object Responses {

  def renderJsonResponse[A : Writes](content: List[A]): JsValue = Json.obj("data" -> content)

  def renderJsonResponse[A : Writes](content: A): JsValue = Json.obj("data" -> content)

}
