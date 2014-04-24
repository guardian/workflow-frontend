package lib

import akka.actor.Actor
import models.WorkflowContent


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader => {

      val messages = AWSWorkflowQueue.getMessages(10)

      for(msg<-messages) {
        val wireStatus = AWSWorkflowQueue.toWireStatus(msg)
        val workflowContent = WorkflowContent.fromWireStatus(wireStatus)
        Database.store.alter {
          items =>
            items.updated(workflowContent.id, workflowContent)
        }
        AWSWorkflowQueue.deleteMessage(msg)
      }
    }
  }

}

case object SqsReader
