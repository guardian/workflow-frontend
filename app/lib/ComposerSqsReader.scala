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
        interestingStatuses = statuses.filter(s => stubs.exists(_.composerId == Some(s.composerId)))
        _ <- Future.traverse(messages)(AWSWorkflowQueue.deleteMessage)
      }  {
        interestingStatuses.foreach(s => PostgresDB.createOrModifyContent(WorkflowContent.fromWireStatus(s)))
      }

  }

}

case object SqsReader
