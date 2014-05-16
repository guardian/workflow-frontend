package lib

import akka.actor.Actor
import models.WorkflowContent
import scala.concurrent.{Future, ExecutionContext}
import ExecutionContext.Implicits.global



class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader =>

      for {
        messages <- AWSWorkflowQueue.getMessages(10)
        statuses = messages.map(AWSWorkflowQueue.toWireStatus)
        stubs    = PostgresDB.getAllStubs
        content = statuses.flatMap(status => stubs.find(_.composerId == Some(status.composerId))
                          .map(stub => WorkflowContent.fromWireStatus(status, stub)))
        _ <- Future.traverse(messages)(AWSWorkflowQueue.deleteMessage)
      }  {
        content.foreach(PostgresDB.createOrModifyContent)
      }

  }

}

case object SqsReader
