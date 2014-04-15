package lib

import models.{Published, WorkflowContent}
import org.joda.time.DateTime
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.json.Json
import akka.actor.Actor


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader => {

      val messages = AWSWorkflowQueue.getMessages(10)

      for(msg<-messages) {
        val item = AWSWorkflowQueue.toWorkflowContent(msg)

        Database.store.alter(s => s.updated(item.path,item))

        AWSWorkflowQueue.deleteMessage(msg)
      }
    }
  }

}

case object SqsReader
