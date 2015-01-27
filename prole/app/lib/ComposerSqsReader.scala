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
  ContentUpdateEvent,
  LifecycleEvent,
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

      if(AWSWorkflowQueue.parseMessage(m) match {
        case Some(e: LifecycleEvent)     => processLifecycleEvent(e)
        case Some(c: ContentUpdateEvent) => processContentUpdateEvent(c)
        case _ => false
      }) {
        CloudWatch.recordMessageProcessed
        AWSWorkflowQueue.deleteMessage(m)
      } else {
        Logger.error(s"message not parsed: $m")
      }
    }

    processMessages
  }

  private def recordWriteStatusError(e: ContentUpdateEvent, sqle: SQLException): Unit = {
    CloudWatch.recordMessageError
    Logger.error(s"unable to write status: $e", sqle)
  }

  private def recordLifecycleEventError(e: LifecycleEvent, sqle: SQLException): Unit = {
    CloudWatch.recordMessageError
    Logger.error(s"unable to perform lifecycle event $e", sqle)
  }

  private def recordStubRetrievalError(id: String, sqle: SQLException): Unit = {
    CloudWatch.recordMessageError
    Logger.error(s"unable to retrieve stub: $id", sqle)
  }

  private def recordUntrackedContent(id: String): Unit = {
    CloudWatch.recordUntrackedContentMessage
    Logger.trace(s"update to non tracked content recieved ($id), ignoring")
  }

  private def stub(id: String): Option[Stub] = {
    val stub = CommonDB.getStubForComposerId(id)
    if(stub.isEmpty) recordUntrackedContent(id)

    stub
  }

  private def contentUpdate(e: ContentUpdateEvent): Boolean = {
    try {
      CommonDB.updateContentFromUpdateEvent(e)
      true
    } catch {
      case sqle: SQLException => recordWriteStatusError(e, sqle); false
    }
  }

  private def processContentUpdateEvent(e: ContentUpdateEvent): Boolean = {
    Logger.trace(s"process content update ${e}")
    stub(e.composerId).map { stub => contentUpdate(e) }.getOrElse(true)
  }

  private def processLifecycleEvent(e: LifecycleEvent): Boolean = {
    Logger.info(s"process lifecycle event '${e.event}' for ${e.composerId}")

    stub(e.composerId).map { stub => {
      try {
        e.event match {
          case "delete" => {
            CommonDB.deleteContent(e.composerId, archive=false)
            Logger.info(s"content deleted successfully: ${e.composerId}")

            true
          }
          case "takedown" => {
            CommonDB.takeDownContent(e.composerId, Some(e.eventTime))
            Logger.info(s"content taken down: ${e.composerId}")

            true
          }
          case _ => {
            Logger.info(s"unrecognised lifecycle event ${e.event}")

            false
          }
        }
      } catch {
        case sqle: SQLException => recordLifecycleEventError(e, sqle); false
      }
    }}.getOrElse(true)
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
