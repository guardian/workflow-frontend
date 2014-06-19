package com.gu.workflow.db

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
