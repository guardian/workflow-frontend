package lib

import akka.actor.Actor
import models.WorkflowContent


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader => {

      val messages = AWSWorkflowQueue.getMessages(10)

      for(msg<-messages) {
        val wireStatus = AWSWorkflowQueue.toWireStatus(msg)

        Database.store.alter {
          items =>
            val existing = items.get(wireStatus.path)
            items.updated(wireStatus.path, existing getOrElse WorkflowContent.fromWireStatus(wireStatus))
        }

        AWSWorkflowQueue.deleteMessage(msg)
      }
    }
  }

}

case object SqsReader
