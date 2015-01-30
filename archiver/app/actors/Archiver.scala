import java.sql.SQLException

import akka.actor.Actor
import com.gu.workflow.db.CommonDB
import org.joda.time.DateTime
import play.api.Logger

class Archiver extends Actor {
  def receive = {
    case Archive => {
      try {
        val archivedItems = CommonDB.archiveOldContent
        Logger.info(s"archived ${archivedItems} items at ${DateTime.now().toString}")
      }
      catch {
        case sqle: SQLException => Logger.error(s"database exception ${sqle}")
      }

    }
  }
}

case object Archive
