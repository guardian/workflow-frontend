package lib

import java.sql.SQLException

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
import models.{
  WorkflowContent, 
  WireStatus, 
  LifecycleEvent, 
  WorkflowNotification,
  Stub
}


class ComposerSqsReader extends Actor {

  def receive = {
    case PollMessages =>
      try { processMessages } 
      catch { case e: Exception => Logger.error("error polling for messages, recheduling", e); reschedule }
  }

  private def reschedule() {
    context.system.scheduler.scheduleOnce(1 second, self, PollMessages)
  }

  override def postRestart(reason: Throwable) { reschedule }

  private def msg = AWSWorkflowQueue.getMessages(messageCount = 1, waitTimeSeconds = 1)

  @tailrec
  private def processMessages {
    for(m <- msg) {
      ComposerSqsReader.updateLastRead()
      
      AWSWorkflowQueue.parseMessage(m) match {
        case Some(s: WireStatus)     => processWireStatus(s) 
        case Some(e: LifecycleEvent) => processLifecycleEvent(e)
        case _ => 
      }

      CloudWatch.recordMessageProcessed
      AWSWorkflowQueue.deleteMessage(m)
    }

    processMessages
  }

  private def recordWriteStatusError(s: WireStatus, sqle: SQLException): Unit = {
    CloudWatch.recordMessageError
    Logger.error(s"unable to write status: $s", sqle)
  }

  private def recordLifecycleEventError(e: LifecycleEvent, sqle: SQLException): Unit = {
    CloudWatch.recordMessageError
    Logger.error(s"unable to perform lifecycle event $e", sqle)
  }

  private def recordUntrackedContent: Unit = {
    CloudWatch.recordUntrackedContentMessage
    Logger.trace("update to non tracked content recieved, ignoring") 
  }

  private def stub(id: String): Option[Stub] = {
    // CommonDB.getStubForComposerId exception will propogate up
    val stub = CommonDB.getStubForComposerId(id)
    if(stub.isEmpty) recordUntrackedContent

    stub
  }

  private def processLifecycleEvent(event: LifecycleEvent) = {
    stub(event.composerId).map { stub => {
      try {
        CommonDB.deleteContent(event.composerId)
      } catch {
        case sqle: SQLException => recordLifecycleEventError(event, sqle)
      }
    }}
  }

  private def processWireStatus(status: WireStatus) = {
    stub(status.composerId).map { stub =>
      try {
        val content = WorkflowContent.fromWireStatus(status, stub)
        if(status.updateType=="live") {
          CommonDB.createOrModifyContent(content, status.revision)
        }
      } catch {
        case sqle: SQLException => recordWriteStatusError(status, sqle)
      }
    }
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
