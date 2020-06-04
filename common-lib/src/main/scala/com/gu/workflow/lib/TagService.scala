package com.gu.workflow.lib

import com.gu.workflow.api.{ApiUtils, WSUtils}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder, Json}
import models.Tag
import play.api.Logging
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
) extends ApiUtils with WSUtils with Logging {
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
      logger.error(s"error in fetching tags: ${e.getMessage}", e)
      Future(List[Tag]())
  }
}
