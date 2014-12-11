package com.gu.workflow.db

import play.api.Logger
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._
import com.gu.workflow.syntax._
import models._
import com.gu.workflow.query._
import com.gu.workflow.db.Schema._

object CommonDB {

  import play.api.Play.current
  import play.api.db.slick.DB
  import WfQuery._

  def stubsQuery(q: WfQuery) = stubs |>
    simpleInSet(q.section.map(_.toString))(_.section) |>
    optInSet(q.contentType)(_.contentType) |>
    simpleInSet(q.prodOffice)(_.prodOffice)

  def getStubs(
    query: WfQuery
                // dueFrom: Option[DateTime] = None,
                // dueUntil: Option[DateTime] = None,
                // section: Option[List[Section]] = None,
                // composerId: Set[String] = Set.empty,
                // contentType: Option[String] = None,
                // unlinkedOnly: Boolean = false,
                // prodOffice: Option[String] = None,
                // createdFrom: Option[DateTime] = None,
                // createdUntil: Option[DateTime] = None
                ): List[Stub] =
    DB.withTransaction { implicit session =>
//      val cIds = if (composerId.nonEmpty) Some(composerId) else None

      val q = stubsQuery(query)
        // (if (unlinkedOnly) stubs.filter(_.composerId.isNull) else stubs) |>
        //   dueFrom.foldl[StubQuery]     ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
        //   dueUntil.foldl[StubQuery]    ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
        //   section.foldl[StubQuery]  { case (q, sections: List[Section]) => q.filter(_.section.inSet(sections.map(_.name))) } |>
        //   contentType.foldl[StubQuery] { case (q, _)  => q.filter(_.contentType === contentType) } |>
        //   cIds.foldl[StubQuery]        ((q, ids)      => q.filter(_.composerId inSet ids)) |>
        //   prodOffice.foldl[StubQuery]  ((q, prodOffice) => q.filter(_.prodOffice === prodOffice)) |>
        //   createdFrom.foldl[StubQuery] ((q, createdFrom) => q.filter(_.createdAt >= createdFrom)) |>
        //   createdUntil.foldl[StubQuery] ((q, createdUntil) => q.filter(_.createdAt < createdUntil))

      q.filter(s => dueDateNotExpired(s.due))
        .list.map(row => Stub.fromStubRow(row))



    }

  def getStubForComposerId(composerId: String): Option[Stub] = DB.withTransaction { implicit session =>
    stubs.filter(_.composerId === composerId).firstOption.map(Stub.fromStubRow(_))
  }

  def getContentForComposerId(composerId: String): Option[WorkflowContent] = DB.withTransaction { implicit session =>
    content.filter(_.composerId === composerId).firstOption.map(WorkflowContent.fromContentRow(_))
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
          (c.path, c.lastModified, c.lastModifiedBy, c.contentType, c.commentable, c.headline, c.mainMedia, c.published, c.timePublished, c.revision, c.storyBundleId))
        .update((wc.path, wc.lastModified, wc.lastModifiedBy, wc.contentType, wc.commentable, wc.headline, wc.mainMedia, wc.published, wc.timePublished, Some(revision), wc.storyBundleId))
  }

  def createContent(wc: WorkflowContent, revision: Option[Long])(implicit session: Session) {
      content += WorkflowContent.newContentRow(wc, revision)
  }

  def takeDownContent(composerId: String, t: Option[DateTime]) = { 
    DB.withTransaction { implicit session =>
      content
        .filter(_.composerId === composerId)
        .map(c => (c.takenDown, c.timeTakenDown))
        .update((true, t))
    }
  }

  def deleteContent(composerId: String) = {
    DB.withTransaction { implicit session =>
      archiveContentQuery((s, c) => s.composerId === composerId)
      content.filter(_.composerId === composerId).delete
      stubs.filter(_.composerId === composerId).delete
    }
  }


  def archiveContentQuery(p: (DBStub, DBContent) => Column[Option[Boolean]])(implicit session: Session) =
    archive
      .map(
        a => (
          a.stubId, a.composerId, a.wasDeleted, a.workingTitle, a.section,
          a.contentType, a.prodOffice, a.createdAt, a.lastModified, a.status,
          a.headline, a.path, a.published, a.timePublished, a.revision,
          a.storybundleid, a.activeinincopy, a.takendown, a.timeTakendown
        )
      )
      .insert(
        for {
          (s, c) <- stubs outerJoin content on (_.composerId === _.composerId)
          if p(s, c)
        }
        yield
          (
            s.pk, s.composerId, true /* was_deleted */, s.workingTitle, s.section,
            s.contentType, s.prodOffice, s.createdAt, c.lastModified, c.status,
            c.headline, c.path, c.published, c.timePublished, c.revision,
            c.storyBundleId, c.activeInInCopy, c.takenDown, c.timeTakenDown
          )
      )
}
