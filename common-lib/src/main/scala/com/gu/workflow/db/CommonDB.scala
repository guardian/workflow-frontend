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

  def getStubs(query: WfQuery, unlinkedOnly: Boolean = false): List[Stub] =
    DB.withTransaction { implicit session =>

      val q = if (unlinkedOnly) stubsQuery(query).filter(_.composerId.isEmpty) else stubsQuery(query)

      q.filter(s => dueDateNotExpired(s.due))
        .list.map(row => Stub.fromStubRow(row))
    }

  def getStubForComposerId(composerId: String): Option[Stub] = DB.withTransaction { implicit session =>
    stubs.filter(_.composerId === composerId).firstOption.map(Stub.fromStubRow(_))
  }

  def getContentForComposerId(composerId: String): Option[WorkflowContent] = DB.withTransaction { implicit session =>
    content.filter(_.composerId === composerId).firstOption.map(WorkflowContent.fromContentRow(_))
  }

  def dueDateNotExpired(due: Column[Option[DateTime]]) = due.isEmpty || due > DateTime.now().minusDays(7)

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
    ((publishedWithinLastDay || c.timePublished.isEmpty) &&

      (dueDateWithinLastWeek  || s.due.isEmpty) &&
      (lastModifiedWithinWeek || dueDateInFuture || c.timePublished.isEmpty))
  }

  def createOrModifyContent(wc: WorkflowContent, revision: Long): Unit =
    DB.withTransaction { implicit session =>
      val contentExists = content.filter(_.composerId === wc.composerId).exists.run
      if (contentExists) updateContent(wc, revision) else createContent(wc, Some(revision))
    }

  def updateContent(wc: WorkflowContent, revision: Long)(implicit session: Session): Int = {
      val mainMedia = wc.mainMedia.getOrElse(WorkflowContentMainMedia())
      content.filter(_.composerId === wc.composerId)
              .filter(c => c.revision <= revision || c.revision.isEmpty)
              .update(WorkflowContent.newContentRow(wc, Some(revision)))
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
