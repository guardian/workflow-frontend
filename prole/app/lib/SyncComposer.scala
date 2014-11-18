package lib

import akka.actor.Actor
import com.gu.workflow.db.CommonDB
import play.api.libs.ws.WS
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
class SyncComposer extends Actor {

    def receive = {
      case ComposerQuery => {
        val workflowItems = CommonDB.publishedWithNoPublicationDate

        workflowItems.headOption.map { wc =>
          val composerApi = "https://composer.gutools.co.uk/api/content/"

          val url = composerApi+wc.composerId
          println(s"making a web request to ${url}")
          WS.url(url).get().map { res =>
            println(s"here is my response ${res.body}")
            println(s"here is my response status ${res.status}")
          }
        }
      }
    }
}

case object ComposerQuery