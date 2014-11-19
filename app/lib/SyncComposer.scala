package lib

import play.api.libs.json.{JsError, JsSuccess}
import play.api.libs.ws.WS

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.{Failure, Success}
import play.api.Play.current
import akka.actor.Actor

class SyncComposer extends Actor {
    var contentIds: List[String] = Nil
    def receive = {
      case ContentId => {
        //retrieve all unpublished data in composer
        val dr = PostgresDB.getContent(published=Some(false))
        contentIds = dr.map(d => d.wc.composerId)
        println(s"updating ${contentIds.size}")
        self ! ComposerQuery
      }

      case ComposerQuery => {

        val composerApi = "https://composer.gutools.co.uk/api/content/"
        val key="Cookie"
        val cookieName="gutoolsAuth="
        val cookieValue ="COPYFROMCOOKIE"

        contentIds match {
          case Nil => println("finsihed query")
          case h :: tail => {
            val composerId = h
            val url = composerApi+composerId
            println(s"calling composer url ${url}")
            WS.url(url).withHeaders((key,cookieName+cookieValue)).get().onComplete {
              case Success(res) => {
                println(s"status ${res.status}")
                (res.json \ "data").validate[models.PublishedData] match {
                  case JsSuccess(pub, _) => {
                    println(s"success parse ${pub}")
                    println("updating content")
                    PostgresDB.updateContent(pub.composerId, pub)
                    contentIds = tail
                    println(s"recalling self with ${contentIds.size}")
                    self ! ComposerQuery
                  }
                  case JsError(error) => {
                    println(s"error processing ${composerId} error")
                    contentIds = tail
                    println(s"recalling self with ${contentIds.size}")
                    self ! ComposerQuery
                  }
                }
              }
              case Failure(error) =>{
                println(s"error ${error} could not update composer Id ${h}")
                contentIds = tail
                println(s"recalling self with ${contentIds.size}")
                self ! ComposerQuery
              }
            }
          }
        }
      }
    }
}

case object ComposerQuery
case object ContentId