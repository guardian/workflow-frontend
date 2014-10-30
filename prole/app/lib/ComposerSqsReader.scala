package lib

import scala.annotation.tailrec
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.language.postfixOps
import java.util.concurrent.atomic.AtomicReference
import org.joda.time.DateTime
import akka.actor.Actor
import play.api.libs.json.{JsError, JsSuccess}
import play.api.Logger
import com.gu.workflow.db.CommonDB
import models.WorkflowContent

class ComposerSqsReader extends Actor {

  def receive = {
    case PollMessages =>
      try { processMessages } 
      catch { case e: Exception => reschedule }
  }

  private def reschedule() {
    context.system.scheduler.scheduleOnce(1 second, self, PollMessages)
  }

  override def postRestart(reason: Throwable) { reschedule }

  @tailrec
  private def processMessages {
    for(
      message <- AWSWorkflowQueue.getMessages(messageCount = 1, waitTimeSeconds = 1)
    ) {
      ComposerSqsReader.updateLastRead()
      
      AWSWorkflowQueue.toWireStatus(message) match {
        case JsError(e) => Logger.error(s"error parsing wirestatus: $e")
        case JsSuccess(recievedStatus, _) => {
          CommonDB.getStubForComposerId(recievedStatus.composerId) match {
            case Some(stub) => {
              val content = WorkflowContent.fromWireStatus(recievedStatus, stub)
              CommonDB.createOrModifyContent(content, recievedStatus.revision)
            }
            case None => Logger.trace("update to non tracked content recieved, ignoring") // this is where we could start tracking content automatically
          }
        }
      }

      AWSWorkflowQueue.deleteMessage(message)
    }
    processMessages
  }
}

object ComposerSqsReader {
  private val lastTimeSuccessfullyRead: AtomicReference[Option[DateTime]] = new AtomicReference(None)
  def lastUpdated(): Option[DateTime] = lastTimeSuccessfullyRead.get()
  def updateLastRead(): Unit = {
    lastTimeSuccessfullyRead.set(Some(new DateTime()))
  }
}

case object PollMessages
