package com.gu.workflow.query


import com.gu.workflow.db.Schema
import play.api.Logger
import play.api.mvc.{Request, AnyContent}

import scala.slick.ast.BaseTypedType
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import scala.slick.lifted.{LiteralColumn, Query, Column}
import models._
import models.Flag.Flag
import org.joda.time.DateTime
import com.gu.workflow.db.Schema._
import com.gu.workflow.syntax._
import com.gu.workflow.lib._
import scala.language.postfixOps
import lib._

sealed trait ContentState { def name: String }
case object PublishedState extends ContentState { val name = "published" }
case object TakenDownState extends ContentState { val name = "takendown" }
case object ScheduledState extends ContentState { val name = "scheduled" }
case object EmbargoedState extends ContentState { val name = "embargoed" }
case object DraftState     extends ContentState { val name = "draft"     }
case class UnknownState(name: String) extends ContentState

case class WfQueryTime(
  from  : Option[DateTime],
  until : Option[DateTime]
)

case class DateRange(from: DateTime, until: DateTime)

object DateRange {
  def apply(fromOpt: Option[DateTime], untilOpt: Option[DateTime]): Option[DateRange] = {
    for {
      from <- fromOpt
      until <- untilOpt
    } yield DateRange(from, until)
  }
}


case class WfQuery(
  section         : Seq[Section]         = Nil,
  dueTimes        : Seq[WfQueryTime]     = Nil,
  status          : Seq[Status]          = Nil,
  contentType     : Seq[String]          = Nil,
  flags           : Seq[Flag]            = Nil,
  prodOffice      : Seq[String]          = Nil,
  creationTimes   : Seq[WfQueryTime]     = Nil,
  text            : Option[String]       = None,
  assignedTo      : Seq[String]          = Nil,
  assignedToEmail : Seq[String]          = Nil,
  composerId      : Option[String]       = None,
  inIncopy        : Option[Boolean]      = None,
  state           : Option[ContentState] = None,
  touched         : Seq[String]          = Nil,
  viewTimes       : Option[DateRange]    = None,
  trashed         : Boolean              = false
)
object WfQuery {
  // correctly typed shorthand
  private val TrueCol : Column[Boolean] = LiteralColumn(true)
  private val TrueOptCol : Column[Option[Boolean]] = LiteralColumn(Some(true))
  private val FalseCol: Column[Boolean] = LiteralColumn(false)
  private val FalseOptCol: Column[Option[Boolean]] = LiteralColumn(Some(false))

  def dateTimeToQueryTime(from: Option[DateTime], until: Option[DateTime]) =
    (from, until) match {
      case (None, None)  => Nil
      case (from, until) => List(WfQueryTime(from, until))
    }

  def stateQuery(state: ContentState): (DBStub, DBContent) => Column[Option[Boolean]] = { (s,c)=>
    state match {
      case PublishedState => c.published
      case TakenDownState => c.takenDown
      case ScheduledState => c.scheduledLaunchDate >= DateTime.now
      case EmbargoedState => c.embargoedIndefinitely || c.embargoedUntil > DateTime.now
      case DraftState => (s.composerId isEmpty) || !(c.published || c.takenDown)
      case default => TrueCol
    }
  }

  def textSearch(text: String): (DBStub, DBContent) => Column[Option[Boolean]] = { (s,c) =>
    (s.workingTitle.toUpperCase like ("%" + text.toUpperCase + "%")) ||
      (c.headline.toUpperCase like ("%" + text.toUpperCase + "%")) ||
      (s.note.toUpperCase like ("%"  + text.toUpperCase + "%"))
  }

  def dateRangeSearch(dt: DateRange): (DBStub, DBContent) => Column[Option[Boolean]] = { (s,c) =>
    (s.lastModified < dt.until  && s.lastModified > dt.from) ||
    (s.due < dt.until  && s.due > dt.from) ||
    (s.createdAt < dt.until  && s.createdAt > dt.from) ||
    (c.lastModified < dt.until  && c.lastModified > dt.from) ||
    (c.timePublished < dt.until  && c.timePublished > dt.from) ||
    (c.timeTakenDown < dt.until  && c.timeTakenDown > dt.from) ||
    (c.embargoedUntil < dt.until  && c.embargoedUntil > dt.from) ||
    (c.scheduledLaunchDate < dt.until  && c.scheduledLaunchDate > dt.from)
  }

  def inSet[A: BaseTypedType](seq: Seq[A], col: Column[Option[A]], base: Column[Option[Boolean]]): Column[Option[Boolean]] = {
    seq match {
      case Nil => base
      case _ => col inSet seq
    }
  }

  def statusQuery(q: WfQuery): (DBStub, DBContent) => Column[Option[Boolean]] = { (s,c) =>
    q.status match {
      case Nil => TrueOptCol
      case _ => {
        val (stubsStatus, contentStatus) = q.status.partition(s => { s == models.Status("Stub")})

        (stubsStatus.headOption.fold(FalseOptCol)(stub => s.composerId isEmpty) ||
          inSet[String](contentStatus.map(_.toString.toUpperCase), c.status.toUpperCase, FalseOptCol))
      }
    }
  }

  def stubAndContentFilters(q: WfQuery): (DBStub, DBContent) => Column[Option[Boolean]] = { (s,c) =>
    q.composerId.fold(TrueOptCol)(id => c.composerId === id) &&
    q.state.fold(TrueOptCol)(state => stateQuery(state)(s,c)) &&
    q.inIncopy.fold(TrueOptCol)(in => if(in) c.storyBundleId.nonEmpty else c.storyBundleId.isEmpty) &&
    q.text.fold(TrueOptCol)(t => textSearch(t)(s,c)) &&
    q.viewTimes.fold(TrueOptCol)(dt => dateRangeSearch(dt)(s,c)) &&
      statusQuery(q)(s,c) &&
    inSet[String](q.section.map(_.toString.toUpperCase), s.section.toUpperCase, TrueOptCol) &&
    inSet[String](q.contentType.map(_.toUpperCase), s.contentType.toUpperCase, TrueOptCol) &&
    inSet[String](q.prodOffice.map(_.toUpperCase), s.prodOffice.toUpperCase, TrueOptCol) &&
    inSet[Flag](q.flags, s.needsLegal, TrueOptCol) &&
    (q.dueTimes.headOption.fold(TrueOptCol)(qt => s.due < qt.until && s.due > qt.from)) &&
    (q.creationTimes.headOption.fold(TrueOptCol)(qt => s.createdAt < qt.until && s.createdAt > qt.from)) &&
    (if(q.trashed) (s.trashed) else (s.trashed===false) || (s.trashed isEmpty))
  }

  def stubAndCollaborator(q: WfQuery): (DBStub, DBCollaborator) => Column[Option[Boolean]] = { (s, coll) =>
    (q.assignedToEmail ++ q.touched).headOption.fold(TrueOptCol)(_ =>
      q.assignedToEmail.headOption.fold(FalseOptCol)(e => s.assigneeEmail === e) ||
            q.touched.headOption.fold(FalseOptCol)(e => coll.email ===e)
    )
  }

  def stubAndCollaboratorPredOpt(q: WfQuery): Option[(DBStub, DBCollaborator) => Column[Option[Boolean]]] = {
    (q.assignedToEmail ++ q.touched).headOption.map(_ => stubAndCollaborator(q))
  }



  def contentLookup(composerId: String): StubAndContentQuery = {
    for {
      s <- stubs.sortBy(s => (s.priority.desc, s.workingTitle))
      c <- content
      if(s.composerId === c.composerId && c.composerId === composerId)
    } yield (s,c)
  }



}
