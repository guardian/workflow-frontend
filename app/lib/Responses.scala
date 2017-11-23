package lib

import io.circe.{Encoder, Json}
import io.circe.syntax._

object Responses {

  def renderJsonResponse[A](content: List[A])(implicit encoder: Encoder[A]): Json = Json.obj(("data", content.asJson))

  def renderJsonResponse[A](content: A)(implicit encoder: Encoder[A]): Json = Json.obj(("data", content.asJson))

  def renderCreateJson[A](id: A, status: String)(implicit encoder: Encoder[A]): Json =
    Json.obj(
      ("data", Json.obj(("stubId", id.asJson))),
      ("status", status.asJson)
    )
}
