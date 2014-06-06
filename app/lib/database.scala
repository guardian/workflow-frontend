package lib

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._

import models._
import lib.syntax._

import akka.agent.Agent
import play.api.libs.ws._
import play.api.libs.json.JsArray

import org.joda.time._


object PostgresDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  type StubRow = (
    Long,             // pk
    String,           // working_title
    String,           // section
    Option[DateTime], // due
    Option[String],   // assign_to
    Option[String]    // composer_id
  )

  case class DBStub(tag: Tag) extends Table[StubRow](tag, "stub") {
    def pk           = column [Long]             ("pk", O.PrimaryKey, O.AutoInc)
    def workingTitle = column [String]           ("working_title")
    def section      = column [String]           ("section")
    def due          = column [Option[DateTime]] ("due")
    def assignee     = column [Option[String]]   ("assign_to")
    def composerId   = column [Option[String]]   ("composer_id")
    def * = (pk, workingTitle, section, due, assignee, composerId)
  }

  type ContentRow = (
    String,         // composer_id
    Option[String], // path
    DateTime,       // last_modified
    Option[String], // last_modified_by
    String,         // status
    String,         // content_type
    Boolean,        // commentable
    Option[String], // headline
    Boolean         // published
  )

  case class DBContent(tag: Tag) extends Table[ContentRow](tag, "content") {
    def composerId     = column [String]         ("composer_id", O.PrimaryKey)
    def path           = column [Option[String]] ("path")
    def lastModified   = column [DateTime]       ("last_modified")
    def lastModifiedBy = column [Option[String]] ("last_modified_by")
    def status         = column [String]         ("status")
    def contentType    = column [String]         ("content_type")
    def commentable    = column [Boolean]        ("commentable")
    def headline       = column [Option[String]] ("headline")
    def published      = column [Boolean]        ("published")
    def * = (composerId, path, lastModified, lastModifiedBy, status, contentType, commentable, headline, published)
  }

  type StubQuery = Query[DBStub, StubRow]
  type ContentQuery = Query[DBContent, ContentRow]

  val stubs: StubQuery = TableQuery(DBStub)
  val content: ContentQuery = TableQuery(DBContent)

  def getStubs(
    dueFrom: Option[DateTime] = None,
    dueUntil: Option[DateTime] = None,
    composerId: Set[String] = Set.empty
  ): List[Stub] =
    DB.withTransaction { implicit session =>

      val cIds = if (composerId.nonEmpty) Some(composerId) else None

      val q =
        stubs |>
          dueFrom.foldl[StubQuery]  ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
          dueUntil.foldl[StubQuery] ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
          cIds.foldl[StubQuery]     ((q, ids)      => q.filter(_.composerId inSet ids))

      q.list.map {
        case (pk, title, section, due, assignee, composerId) =>
          Stub(Some(pk), title, section, due, assignee, composerId)
      }
    }

  def createStub(stub: Stub): Unit =
    DB.withTransaction { implicit session =>
      stubs += ((0, stub.title, stub.section, stub.due, stub.assignee, stub.composerId))
    }

  def updateStub(id: Long, stub: Stub) {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => (s.workingTitle, s.section, s.due, s.assignee, s.composerId))
        .update((stub.title, stub.section, stub.due, stub.assignee, stub.composerId))
    }
  }

  def updateStubWithComposerId(id: Long, composerId: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.composerId)
        .update(Some(composerId))
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

  def createOrModifyContent(wc: WorkflowContent): Unit =
    DB.withTransaction { implicit session =>
      if (updateContent(wc) == 0) createContent(wc)
    }

  def updateContent(wc: WorkflowContent): Int = {
    val published = wc.state == ContentState.Published
    val lastMod = wc.lastModification.dateTime
    val lastModBy = wc.lastModification.user

    DB.withTransaction { implicit session =>
      content
        .filter(_.composerId === wc.composerId)
        .map(c =>
          (c.path, c.lastModified, c.lastModifiedBy, c.status, c.contentType, c.commentable, c.headline, c.published))
        .update((wc.path, lastMod, lastModBy, wc.status.name, wc.`type`, wc.commentable, wc.headline, published))
    }
  }

  def createContent(wc: WorkflowContent) {
    val lastMod = wc.lastModification.dateTime
    val lastModBy = wc.lastModification.user
    val published = wc.state == ContentState.Published

    DB.withTransaction { implicit session =>
      content +=
        ((wc.composerId, wc.path, lastMod, lastModBy, wc.status.name, wc.`type`, wc.commentable, wc.headline, published))
    }
  }

  def getContent(
    section:  Option[Section] = None,
    dueFrom:  Option[DateTime] = None,
    dueUntil: Option[DateTime] = None,
    status:   Option[Status] = None,
    contentType: Option[String] = None,
    published: Option[Boolean] = None
  ): List[DashboardRow] =
    DB.withTransaction { implicit session =>
      val stubsQuery =
        stubs |>
          dueFrom.foldl[StubQuery]  ((q, dueFrom)  => q.filter(_.due >= dueFrom)) |>
          dueUntil.foldl[StubQuery] ((q, dueUntil) => q.filter(_.due < dueUntil)) |>
          section.foldl[StubQuery]  { case (q, Section(s))  => q.filter(_.section === s) }

      val contentQuery =
        content |>
          status.foldl[ContentQuery] { case (q, Status(s)) => q.filter(_.status === s) } |>
          contentType.foldl[ContentQuery] ((q, contentType) => q.filter(_.contentType === contentType)) |>
          published.foldl[ContentQuery] ((q, published) => q.filter(_.published === published))

      val query = for {
        s <- stubsQuery
        c <- contentQuery if s.composerId === c.composerId
      } yield (s, c)

      query.sortBy { case (s, c) => s.due }.list.map {
        case ((pk, title, section, due, assignee, cId),
              (composerId, path, lastMod, lastModBy, status, contentType, commentable, headline, published)) =>
          DashboardRow(
            Stub(Some(pk), title, section, due, assignee, cId),
            WorkflowContent(
              composerId,
              path,
              headline,
              contentType,
              Some(Section(section)),
              Status(status),
              ContentModification("", lastMod, lastModBy),
              commentable,
              if(published) ContentState.Published else ContentState.Draft
            )
          )
      }

    }
}


object SectionDatabase {
  val store: Agent[Set[Section]] = Agent(Set())

  for(apiSections <- loadSectionsFromApi) store.alter(apiSections)

  def upsert(section: Section): Future[Set[Section]] = store.alter(_ + section)
  def remove(section: Section): Future[Set[Section]] = store.alter(_ - section)

  def sectionList: Future[List[Section]] = Future { store.get().toList.sortBy(_.name) }

  // TODO sw 02/05/2014 this a dev bootstrap, remove in favor of persisted list once we've got a persistence mechanism
  private def loadSectionsFromApi = {
    val sectionUrl = "http://content.guardianapis.com/sections.json"
    WS.url(sectionUrl).get().map { resp =>
      val titles = resp.json \ "response" \ "results" match {
        case JsArray(sections) => sections.map{ s => (s \ "webTitle").as[String] }
        case _ => Nil
      }
      titles.map(Section(_)).toSet
    }

  }

}

object StatusDatabase {

  val store: Agent[List[Status]] = Agent(List(
    Status("Writers"),
    Status("Desk"),
    Status("Subs"),
    Status("Revise"),
    Status("Final")
  ))

  def statuses = store.future()

  def find(name: String) = store.get().find(_.name == name)

  def get(name: String) = find(name).get

  def remove(status: Status): Future[List[Status]] = store.alter(_.filterNot(_ == status))

  def add(status: Status): Future[List[Status]] = store.alter(_ :+ status)

  def moveUp(status: Status): Future[List[Status]] = store.alter(moveUp(status, _))

  def moveDown(status: Status): Future[List[Status]] = store.alter(moveDown(status, _))

  private def moveUp(s: Status, ss: List[Status]): List[Status] = {
    val index = ss.indexOf(s)
    if (index > 0) {
      ss.patch(index - 1, List(s, ss(index - 1)), 2)
    } else {
      ss
    }
  }

  private def moveDown(s: Status, ss: List[Status]): List[Status] = {
    val index = ss.indexOf(s)
    if (index + 1 < ss.length && index > -1) {
      ss.patch(index, List(ss(index + 1), s), 2)
    } else {
      ss
    }
  }
}
