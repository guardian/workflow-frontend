package com.gu.workflow.lib

import com.gu.workflow.api.ApiUtils
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder, Json}
import models.Tag
import play.api.Logger
import play.api.libs.ws._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

case class TagArrayItem(data: Tag)
object TagArrayItem {
  implicit val encoder: Encoder[TagArrayItem] = deriveEncoder
  implicit val decoder: Decoder[TagArrayItem] = deriveDecoder
}

class TagService(
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils {
  def getTags(params:  Map[String, String]): Future[List[Tag]] = {
    for {
      response <- getRequest("/hyper/tags", params.toList)
      json <- parseBody(response.body).asFutureOption("Error extracting the tag response.")
    } yield {
      json.getOrElse(Json.Null).hcursor.downField("data").as[List[TagArrayItem]] match {
        case Right(tags) => tags.map(_.data)
        case Left(_) => List[Tag]()
      }
    }
  } recoverWith {
    case e: Exception =>
      Logger.error(s"error in fetching tags: ${e.getMessage}", e)
      Future(List[Tag]())
  }
}
