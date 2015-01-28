import akka.actor.Actor
import com.gu.workflow.db.CommonDB
import play.api.Logger

class Archiver extends Actor {
  def receive = {
    case Archive => {
      val archivedItems = CommonDB.archiveOldContent
      Logger.info(s"archived ${archivedItems} items")
    }
  }
}

case object Archive
