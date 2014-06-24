package lib

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import akka.actor.Actor
import play.api.libs.json.{JsError, JsSuccess}
import play.api.Logger
import com.gu.workflow.syntax.TraverseSyntax._
import com.gu.workflow.db.CommonDB
import models.WorkflowContent


class ComposerSqsReader extends Actor {
  def receive = {

    case SqsReader =>

      for {
          messages <- AWSWorkflowQueue.getMessages(10)
          if messages.nonEmpty
          wireStatuses = messages.flatMap { msg => AWSWorkflowQueue.toWireStatus(msg).fold(
            error => { Logger.error(s"$error"); None },
            wirestatus => Some(msg, wirestatus)
          )}
          stubs = CommonDB.getStubs(composerId = wireStatuses.map(_._2.composerId).toSet)
          composerIds = stubs.flatMap(_.composerId)
          irrelevantMsgs = wireStatuses.filter { case (msg, ws) => !composerIds.contains(ws.composerId) }.map(_._1)
          content = wireStatuses.flatMap { case (msg, ws) => stubs.find(_.composerId == Some(ws.composerId))
                                                             .map(stub => (msg, WorkflowContent.fromWireStatus(ws, stub)))
                                         }
      }
      {
          AWSWorkflowQueue.deleteMessages(irrelevantMsgs)
          content.foreach {
            case (msg, c) =>
              CommonDB.createOrModifyContent(c)
              AWSWorkflowQueue.deleteMessage(msg)
          }
      }

  }

}

case object SqsReader
