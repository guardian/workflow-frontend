package lib

import akka.actor.Actor
import models.WorkflowContent
import scala.concurrent.{Future, ExecutionContext}
import ExecutionContext.Implicits.global
import lib.syntax.TraverseSyntax._
import play.api.libs.json.{JsError, JsSuccess}
import play.api.Logger


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader =>

      for {
        messages <- AWSWorkflowQueue.getMessages(10)
        if messages.nonEmpty
        jsResult = messages.traverse(AWSWorkflowQueue.toWireStatus)
        statuses = jsResult match {
          case JsSuccess(statuses, _) =>  statuses
          case JsError(errors) =>
            Logger.error(errors.toString)
            Nil
        }
        stubs   = PostgresDB.getStubs()
        content = statuses.flatMap(status => stubs.find(_.composerId == Some(status.composerId))
                          .map(stub => WorkflowContent.fromWireStatus(status, stub)))
        _ <- Future.traverse(messages)(AWSWorkflowQueue.deleteMessage)
      }  {
        content.foreach(PostgresDB.createOrModifyContent)
      }

  }

}

case object SqsReader
