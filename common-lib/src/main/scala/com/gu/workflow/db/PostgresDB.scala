package com.gu.workflow.db

import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._
import com.gu.workflow.syntax._
import models._
import com.gu.workflow.db.Schema._


object PostgresDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getStubs(
    dueFrom: Option[DateTime] = None,
    dueUntil: Option[DateTime] = None,
    section:  Option[Section] = None,
    composerId: Set[String] = Set.empty,
    contentType: Option[String] = None,
    unlinkedOnly: Boolean = false
  ): List[Stub] =
    DB.withTransaction { implicit session =>

      val cIds = if (composerId.nonEmpty) Some(composerId) else None

      val q =
        (if (unlinkedOnly) stubs.filter(_.composerId.isNull) else stubs) |>
          dueFrom.foldl[StubQuery]     ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
          dueUntil.foldl[StubQuery]    ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
          section.foldl[StubQuery]     { case (q, Section(s))  => q.filter(_.section === s) } |>
          contentType.foldl[StubQuery] { case (q, _)  => q.filter(_.contentType === contentType) } |>
          cIds.foldl[StubQuery]        ((q, ids)      => q.filter(_.composerId inSet ids))

      q.sortBy(_.due.desc).list.map {
        case (pk, title, section, due, assignee, composerId, contentType) =>
          Stub(Some(pk), title, section, due, assignee, composerId, contentType)
      }
    }

  def createStub(stub: Stub): Unit =
    DB.withTransaction { implicit session =>

      stub.composerId.foreach(ensureContentExistsWithId(_, stub.contentType.getOrElse("article")))

      stubs += ((0, stub.title, stub.section, stub.due, stub.assignee, stub.composerId, stub.contentType))
    }

  def updateStub(id: Long, stub: Stub) {
    DB.withTransaction { implicit session =>

      stub.composerId.foreach(ensureContentExistsWithId(_, stub.contentType.getOrElse("article")))

      stubs
        .filter(_.pk === id)
        .map(s => (s.workingTitle, s.section, s.due, s.assignee, s.composerId, s.contentType))
        .update((stub.title, stub.section, stub.due, stub.assignee, stub.composerId, stub.contentType))
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

  def stubLinkedToComposer(id: Long): Boolean = {
    DB.withTransaction { implicit session =>
      val q = stubs.filter(stub => stub.pk === id && stub.composerId.isNotNull)
      q.length.run > 0
    }
  }

  def deleteStub(id: Long) {
    DB.withTransaction { implicit session =>
      stubs.filter(_.pk === id).delete
    }
  }

  private def ensureContentExistsWithId(composerId: String, contentType: String)(implicit session: Session) {
    val contentExists = content.filter(_.composerId === composerId).exists.run
    if(!contentExists) {
      content +=
        ((composerId, None, new DateTime, None, Status.Writers.name, contentType, false, None, false))
    }
  }

  def createOrModifyContent(wc: WorkflowContent): Unit =
    DB.withTransaction { implicit session =>
      if (updateContent(wc, wc.composerId) == 0) createContent(wc)
    }

  def updateContent(wc: WorkflowContent, composerId: String): Int = {
    DB.withTransaction { implicit session =>
      content
        .filter(_.composerId === composerId)
        .map(c =>
          (c.path, c.lastModified, c.lastModifiedBy, c.status, c.contentType, c.commentable, c.headline, c.published))
        .update((wc.path, wc.lastModified, wc.lastModifiedBy, wc.status.name, wc.contentType, wc.commentable, wc.headline, wc.published))
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

  def createContent(wc: WorkflowContent) {
    DB.withTransaction { implicit session =>
      content +=
        ((wc.composerId, wc.path, wc.lastModified, wc.lastModifiedBy, wc.status.name, wc.contentType, wc.commentable, wc.headline, wc.published))
    }
  }

  def deleteContent(composerId: String) {
    DB.withTransaction { implicit session =>
      content.filter(_.composerId === composerId).delete
      stubs.filter(_.composerId === composerId).delete
    }
  }


}
