package lib

import play.api.libs.json.{JsError, JsSuccess}
import play.api.libs.ws.WS

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.{Failure, Success}
import play.api.Play.current
import akka.actor.Actor

class SyncComposer extends Actor {

    def receive = {
      case ComposerQuery => {
//        val content = PostgresDB.getContent()

        val composerApi = "https://composer.gutools.co.uk/api/content/"
        val key="Cookie"
        val value ="gutoolsAuth=Zmlyc3ROYW1lPUxpbmRzZXkmbGFzdE5hbWU9RGV3JmVtYWlsPWxpbmRzZXkuZGV3QGd1YXJkaWFuLmNvLnVrJmF2YXRhclVybD1odHRwczovL2xoNC5nb29nbGV1c2VyY29udGVudC5jb20vLUJpbFExXzJ3ZWFjL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUxVL3JYV3YzSWtOSjdJL3Bob3RvLmpwZz9zej01MCZzeXN0ZW09Y29tcG9zZXImYXV0aGVkSW49d29ya2Zsb3csY29tcG9zZXImZXhwaXJlcz0xNDE2Mzk1MDg5MDAwJm11bHRpZmFjdG9yPXRydWU=>>91c979a260130dca94c3004780b147406539f7b3;"
//        content.headOption.map { c =>
          val composerId = "5437dd93e4b0be00e22cd869"
          val url = composerApi+composerId
          println(s"calling composer url ${url}")
          WS.url(url).withHeaders((key,value)).get().onComplete {
            case Success(res) => {
              println(s"status ${res.status}")
              (res.json \ "data").validate[models.PublishedData] match {
                case JsSuccess(pub, _) => {
                  
                  PostgresDB.updateContent(pub.composerId, pub)
                }
                case JsError(error) => println(error)
              }
            }
            case Failure(error) => println(s"error ${error}")
          }

//        }
      }
    }
}

case object ComposerQuery