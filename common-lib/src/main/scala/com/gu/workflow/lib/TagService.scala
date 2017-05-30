package com.gu.workflow.lib

import models.Tag
import play.api.Logger
import play.api.Play.current
import play.api.data.validation.ValidationError
import play.api.libs.json._
import play.api.libs.ws._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

case class TagArrayItem(data: Tag)

object TagArrayItem {
  implicit val jsonFormat: Format[TagArrayItem] = Json.format[TagArrayItem]
}

case class TagService(tagApiUrl: String)


object TagService {
  def getTags(queryUrl: String): Future[List[Tag]] = {
    import scala.concurrent.ExecutionContext.Implicits.global
    for {
      response <- WS.url(queryUrl).withRequestTimeout(2000).get()
    } yield {
      (response.json \ "data").validate[List[TagArrayItem]] match {
        case JsSuccess(tais: List[TagArrayItem], _) => tais.map(_.data)
        case JsError(errors: Seq[(JsPath, Seq[ValidationError])]) => List[Tag]()
      }
    }
  } recoverWith {
    case e: Exception =>
      Logger.error(s"error in fetching tags: ${e.getMessage}", e)
      Future(List[Tag]())
  }
}
