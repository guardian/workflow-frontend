package lib

import akka.actor.Actor
import models.WorkflowContent
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader =>

      for (messages <- AWSWorkflowQueue.getMessages(10)) {
        for(msg<-messages) {
          val wireStatus = AWSWorkflowQueue.toWireStatus(msg)
          ContentDatabase.doesNotContainPath(wireStatus.path).map { newPath =>
            if(newPath) {
              val workflowContent = WorkflowContent.fromWireStatus(wireStatus)
              ContentDatabase.store.alter {
                items =>
                  items.updated(workflowContent.id, workflowContent)
              }
            }
          }
          AWSWorkflowQueue.deleteMessage(msg)
        }
      }
  }

}

case object SqsReader
