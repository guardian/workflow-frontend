package lib

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import akka.actor.Actor
import play.api.libs.json.{JsError, JsSuccess}
import play.api.Logger
import com.gu.workflow.syntax.TraverseSyntax._
import com.gu.workflow.db.CommonDB
import models.{WireStatus, WorkflowContent}
import java.util.concurrent.atomic.AtomicReference
import org.joda.time.DateTime

class ComposerSqsReader extends Actor {

  def receive = {

    case SqsReader =>

      for {
          messages <- AWSWorkflowQueue.getMessages(10)
          _ = ComposerSqsReader.updateLastRead()
          if messages.nonEmpty
          wireStatuses = messages.flatMap { msg => AWSWorkflowQueue.toWireStatus(msg).fold(
            error => { Logger.error(s"$error"); None },
            wirestatus => Some(msg, wirestatus)
          )}
          stubs = CommonDB.getStubs(composerId = wireStatuses.map(_._2.composerId).toSet)
          composerIds = stubs.flatMap(_.composerId)
          irrelevantMsgs = wireStatuses.collect { case (msg, ws) if !composerIds.contains(ws.composerId) => msg }
          content = wireStatuses.flatMap { case (msg, ws) => stubs.find(_.composerId == Some(ws.composerId))
                                                             .map(stub => (msg, ws, WorkflowContent.fromWireStatus(ws, stub)))
                                         }
      }
      {
          AWSWorkflowQueue.deleteMessages(irrelevantMsgs)
          content.foreach {
            case (msg, ws, c) =>
              CommonDB.createOrModifyContent(c, ws.revision)
              if(ComposerSqsReader.setPublishedTime(ws)) {
                val publishedTime = ws.lastMajorRevisionDate.getOrElse(ws.lastModified)
                CommonDB.setPublishedTime(publishedTime, c.composerId)
              }
              AWSWorkflowQueue.deleteMessage(msg)
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

  def setPublishedTime(wireStatus: WireStatus): Boolean = {
    wireStatus.whatChanged == "published" && wireStatus.published
  }
}

case object SqsReader
