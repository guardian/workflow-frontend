package com.gu.workflow.lib

import play.api.data.validation.ValidationError
import play.api.libs.{json, ws}
import play.api.libs.ws._
import scala.concurrent.Future
import play.api.mvc._
import play.api.libs.json._
import play.api.Logger
import play.api.Play.current
import models.Tag



case class TagArrayItem(data: Tag)

object TagArrayItem {
  implicit val jsonFormat = Json.format[TagArrayItem]
}

case class TagService(tagApiUrl: String)


object TagService {
  def getTags(queryUrl: String): Future[Option[List[Tag]]] = {
    import scala.concurrent.ExecutionContext.Implicits.global
    for {
      response <- WS.url(queryUrl).get()
    } yield {
      (response.json \ "data").validate[List[TagArrayItem]] match {
        case JsSuccess(tais: List[TagArrayItem], _) => Some(tais.map(_.data))
        case JsError(errors: Seq[(JsPath, Seq[ValidationError])]) => None
      }
    }
  }
}
