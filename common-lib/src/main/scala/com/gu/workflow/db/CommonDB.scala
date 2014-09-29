package com.gu.workflow.db

import play.api.Logger
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._
import com.gu.workflow.syntax._
import models._
import com.gu.workflow.db.Schema._


object CommonDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getStubs(
                dueFrom: Option[DateTime] = None,
                dueUntil: Option[DateTime] = None,
                section: Option[Section] = None,
                composerId: Set[String] = Set.empty,
                contentType: Option[String] = None,
                unlinkedOnly: Boolean = false,
                prodOffice: Option[String] = None,
                createdFrom: Option[DateTime] = None,
                createdUntil: Option[DateTime] = None
                ): List[Stub] =
    DB.withTransaction { implicit session =>

      val cIds = if (composerId.nonEmpty) Some(composerId) else None

      val q =
        (if (unlinkedOnly) stubs.filter(_.composerId.isNull) else stubs) |>
          dueFrom.foldl[StubQuery]     ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
          dueUntil.foldl[StubQuery]    ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
          section.foldl[StubQuery]     { case (q, Section(s))  => q.filter(_.section === s) } |>
          contentType.foldl[StubQuery] { case (q, _)  => q.filter(_.contentType === contentType) } |>
          cIds.foldl[StubQuery]        ((q, ids)      => q.filter(_.composerId inSet ids)) |>
          prodOffice.foldl[StubQuery]  ((q, prodOffice) => q.filter(_.prodOffice === prodOffice)) |>
          createdFrom.foldl[StubQuery] ((q, createdFrom) => q.filter(_.createdAt >= createdFrom)) |>
          createdUntil.foldl[StubQuery] ((q, createdUntil) => q.filter(_.createdAt < createdUntil))

      q.filter(s => dueDateNotExpired(s.due))
        .list.map(row => Stub.fromStubRow(row))



    }

  def dueDateNotExpired(due: Column[Option[DateTime]]) = due.isNull || due > DateTime.now().minusDays(7)

  def displayContentItem(s: Schema.DBStub, c: Schema.DBContent) = {
    withinDisplayTime(s, c) ||
      //or item has a status of hold
      c.status === Status("Hold").name
  }

  def withinDisplayTime(s: Schema.DBStub, c: Schema.DBContent) = {
    def publishedWithinLastDay = c.timePublished > DateTime.now().minusDays(1)
    def dueDateWithinLastWeek = s.due > DateTime.now().minusDays(7)
    def lastModifiedWithinWeek = c.lastModified > DateTime.now().minusDays(7)
    def dueDateInFuture = s.due > DateTime.now()
    //content item has been published within last 24 hours
    ((publishedWithinLastDay || c.timePublished.isNull) &&

      (dueDateWithinLastWeek || s.due.isNull) &&
      (lastModifiedWithinWeek || c.lastModified.isNull || dueDateInFuture || c.timePublished.isNull))
  }

  def createOrModifyContent(wc: WorkflowContent, revision: Long): Unit =
    DB.withTransaction { implicit session =>
      val contentExists = content.filter(_.composerId === wc.composerId).exists.run
      if (contentExists) updateContent(wc, revision)
      else createContent(wc, Some(revision))
    }


  def updateContent(wc: WorkflowContent, revision: Long)(implicit session: Session): Int = {
      content
        .filter(_.composerId === wc.composerId)
        .filter(c => c.revision < revision || c.revision.isNull)
        .map(c =>
          (c.path, c.lastModified, c.lastModifiedBy, c.contentType, c.commentable, c.headline, c.published, c.timePublished, c.revision))
        .update((wc.path, wc.lastModified, wc.lastModifiedBy, wc.contentType, wc.commentable, wc.headline, wc.published, wc.timePublished, Some(revision)))
  }

  def createContent(wc: WorkflowContent, revision: Option[Long])(implicit session: Session) {
      content += WorkflowContent.newContentRow(wc, revision)
  }

  def deleteContent(composerId: String) {
    DB.withTransaction { implicit session =>
      content.filter(_.composerId === composerId).delete
      stubs.filter(_.composerId === composerId).delete
    }
  }
}
