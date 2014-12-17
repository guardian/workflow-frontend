package lib

import models.Flag.Flag
import models._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time.DateTime
import play.api.libs.json.{JsObject, Writes}
import scala.slick.driver.PostgresDriver.simple._
import com.gu.workflow.db.Schema._
import com.gu.workflow.syntax._
import com.gu.workflow.db.CommonDB._
import com.gu.workflow.query._

object PostgresDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getContent(
                  section:      Option[List[Section]]  = None,
                  desk:         Option[Desk]     = None,
                  dueFrom:      Option[DateTime] = None,
                  dueUntil:     Option[DateTime] = None,
                  status:       Option[Status]   = None,
                  contentType:  Option[String]   = None,
                  published:    Option[Boolean]  = None,
                  flags:        Seq[String]      = Nil,
                  prodOffice:   Option[String]   = None,
                  createdFrom:  Option[DateTime] = None,
                  createdUntil: Option[DateTime] = None
  ): List[DashboardRow] =
    getContent(WfQuery.fromOptions(
                 section, desk, dueFrom, dueUntil, status, contentType,
                 published, flags, prodOffice, createdFrom, createdUntil
               )
    )

  def getContent(q: WfQuery): List[DashboardRow] =
    DB.withTransaction { implicit session =>

      val query = for {
        s <- WfQuery.stubsQuery(q)
        c <- WfQuery.contentQuery(q)
        if s.composerId === c.composerId
      } yield (s, c)

      query.filter( {case (s,c) => displayContentItem(s, c) })
           .list.map {
            case (stubData, contentData) =>
          val stub    = Stub.fromStubRow(stubData)
          val content = WorkflowContent.fromContentRow(contentData)

          DashboardRow(stub, content)
      }
    }

  private def ensureContentExistsWithId(composerId: String, contentType: String, activeInInCopy: Boolean = false)(implicit session: Session) {
    val contentExists = content.filter(_.composerId === composerId).exists.run
    if(!contentExists) {
      content +=
      ((composerId,
        None,
        new DateTime,
        None,
        Status.Writers.name,
        contentType,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        activeInInCopy,
        false,
        None))
    }
  }

  def createStub(stub: Stub, activeInInCopy: Boolean = false): Unit =
    DB.withTransaction { implicit session =>
      stub.composerId.foreach(ensureContentExistsWithId(_, stub.contentType.getOrElse("article"), activeInInCopy))
      stubs += Stub.newStubRow(stub)
    }

  def getContentByComposerId(composerId: String): Option[DashboardRow] = {
    DB.withTransaction { implicit session =>

      val query = for {
        s <- stubs.filter(_.composerId === composerId)
        c <- content
        if s.composerId === c.composerId
      } yield (s, c)

      query.firstOption map {case (stubData, contentData) =>
        val stub    = Stub.fromStubRow(stubData)
        val content = WorkflowContent.fromContentRow(contentData).copy(
          section = Some(Section(stub.section))
        )
        DashboardRow(stub, content)
      }
    }
  }

  def updateStub(id: Long, stub: Stub) {
    DB.withTransaction { implicit session =>

      stub.composerId.foreach(ensureContentExistsWithId(_, stub.contentType.getOrElse("article")))

      stubs
        .filter(_.pk === id)
        .map(s => (s.workingTitle, s.section, s.due, s.assignee, s.composerId, s.contentType, s.priority, s.prodOffice, s.needsLegal, s.note))
        .update((stub.title, stub.section, stub.due, stub.assignee, stub.composerId, stub.contentType, stub.priority, stub.prodOffice, stub.needsLegal, stub.note))
    }
  }

  def updateStubWithComposerId(id: Long, composerId: String, contentType: String): Int = {
    DB.withTransaction { implicit session =>

      ensureContentExistsWithId(composerId, contentType)

      stubs
        .filter(_.pk === id)
        .map(s => (s.composerId, s.contentType))
        .update((Some(composerId), Some(contentType)))
    }
  }

  def updateStubWithAssignee(id: Long, assignee: Option[String]): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.assignee)
        .update(assignee)
    }
  }

  def updateStubDueDate(id: Long, dueDate: Option[DateTime]): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.due)
        .update(dueDate)
    }
  }

  def updateStubNote(id: Long, input: String): Int = {
    val note: Option[String] = if(input.length > 0) Some(input) else None
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.note)
        .update(note)
    }
  }

  def updateStubProdOffice(id: Long, prodOffice: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.prodOffice)
        .update(prodOffice)
    }
  }

  def updateStubSection(id: Long, section: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.section)
        .update(section)
    }
  }

  def updateStubWorkingTitle(id: Long, workingTitle: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.workingTitle)
        .update(workingTitle)
    }
  }

  def updateStubPriority(id: Long, priority: Int): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.priority)
        .update(priority)
    }
  }

  def updateStubLegalStatus(id: Long, status: Flag): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.needsLegal)
        .update(status)
    }
  }

  def stubLinkedToComposer(id: Long): Boolean = {
    DB.withTransaction { implicit session =>
      val q = stubs.filter(stub => stub.pk === id && stub.composerId.isNotNull)
      q.length.run > 0
    }
  }

  def deleteStub(id: Long) {
    DB.withTransaction { implicit session =>

      archiveContentQuery((s, c) => s.pk === id)

      val queryCurrentStub = stubs.filter(_.pk === id)

      // Delete from Content table
      content.filter(c => c.composerId in queryCurrentStub.map(_.composerId)).delete

      // Delete from Stub table
      queryCurrentStub.delete
    }
  }

  def updateContentStatus(status: String, composerId: String): Int = {
    DB.withTransaction { implicit session =>
      val q = for {
        wc <- content if wc.composerId === composerId
      } yield wc.status
      q.update(status)
    }
  }
}
