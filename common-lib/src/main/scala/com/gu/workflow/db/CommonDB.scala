package com.gu.workflow.db

import play.api.Logger
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._
import com.gu.workflow.syntax._
import models._
import com.gu.workflow.query._
import com.gu.workflow.db.Schema._
import com.gu.workflow.lib._

object CommonDB {

  import play.api.Play.current
  import play.api.db.slick.DB
  import WfQuery._

  def getStubs(query: WfQuery, unlinkedOnly: Boolean = false): List[Stub] =
    DB.withTransaction { implicit session =>

      val q = if (unlinkedOnly) stubsQuery(query).filter(_.composerId.isEmpty) else stubsQuery(query)

      q.sortBy(s => (s.priority.desc, s.workingTitle)).list.map(row => Stub.fromStubRow(row))
    }

  def getStubForComposerId(composerId: String): Option[Stub] = DB.withTransaction { implicit session =>
    stubs.filter(_.composerId === composerId).firstOption.map(Stub.fromStubRow(_))
  }

  def getContentForComposerId(composerId: String): Option[WorkflowContent] = DB.withTransaction { implicit session =>
    content.filter(_.composerId === composerId).firstOption.map(WorkflowContent.fromContentRow(_))
  }

  def hideContentItem(s: Schema.DBStub, c: Schema.DBContent) = {
      c.status === Status("Final").name &&
        c.published &&
        c.lastModified < Util.roundDateTime(DateTime.now().minusHours(24),Duration.standardMinutes(5))
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

  def updateContentFromUpdateEvent(e: ContentUpdateEvent): Int = {
    val mainMedia = WorkflowContentMainMedia.getMainMedia(e.mainBlock).getOrElse(
      WorkflowContentMainMedia(None, None, None, None)
    )

    DB.withTransaction { implicit session =>
      val q = content.filter(_.composerId === e.composerId)
        .filter(c => c.revision <= e.revision || c.revision.isEmpty)

      val workflowContent = q.firstOption.map(WorkflowContent.fromContentRow(_))
      val takenDown = workflowContent.map { c => c.takenDown }.getOrElse(false)
      def isTakenDown(published: Boolean, takenDown: Boolean): Boolean = {
        if(published) { false } else { takenDown }
      }

      q.map(c => (
          c.path, c.lastModified, c.lastModifiedBy, c.contentType,
          c.commentable, c.headline, c.standfirst,
          c.trailtext, c.mainMedia, c.mainMediaUrl,
          c.mainMediaCaption, c.mainMediaAltText, c.trailImageUrl,
          c.published, c.timePublished, c.revision, c.wordCount, c.takenDown,
          c.storyBundleId)
         )
         .update((e.path, e.lastModified, e.user, e.`type`,
           e.commentable, e.headline, e.standfirst,
           e.trailText, mainMedia.mediaType, mainMedia.url, mainMedia.caption,
           mainMedia.altText, WorkflowContent.getTrailImageUrl(e.thumbnail), e.published, e.publicationDate,
                  Some(e.revision), e.wordCount, isTakenDown(e.published, takenDown),
                  e.storyBundleId))
    }

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

  def archiveOldContent: Int = {
    DB.withTransaction { implicit session =>

      val pred = (s: DBStub, c: DBContent) => {
        c.timePublished <  DateTime.now().minus(Duration.standardDays(30)) &&
        c.lastModified < DateTime.now().minus(Duration.standardDays(30)) &&
          !WorkflowContent.visibleOnUi(c)
      }

      val composerIds = archiveContentQuery(pred, wasDeleted=false)
      deleteContentItems(composerIds)

    }

  }

  def deleteContentItems(composerIds: Seq[String]): Int = {
    DB.withTransaction { implicit session =>
      content.filter(_.composerId inSet composerIds).delete
      stubs.filter(_.composerId inSet composerIds).delete
    }

  }

  def archiveContentQuery(p: (DBStub, DBContent) => Column[Option[Boolean]], wasDeleted:Boolean=true)(implicit session: Session): Seq[String] = {
    (archive
      .map(
        a => (
          a.stubId, a.composerId, a.wasDeleted, a.workingTitle, a.section,
          a.contentType, a.prodOffice, a.createdAt, a.lastModified, a.status,
          a.headline, a.path, a.published, a.timePublished, a.revision,
          a.storybundleid, a.activeinincopy, a.takendown, a.timeTakendown
          )
      )
      .returning(archive.map(a => a.composerId))
      .insert(
        for {
          (s, c) <- stubs outerJoin content on (_.composerId === _.composerId)
          if p(s, c)
        }
        yield
          (
            s.pk, s.composerId, wasDeleted, s.workingTitle, s.section,
            s.contentType, s.prodOffice, s.createdAt, c.lastModified, c.status,
            c.headline, c.path, c.published, c.timePublished, c.revision,
            c.storyBundleId, c.activeInInCopy, c.takenDown, c.timeTakenDown
            )
      )).flatten
  }
}
