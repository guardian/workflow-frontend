package lib

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
