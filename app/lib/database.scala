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
    Option[String],    // composer_id
    Option[String]    // content_type
  )

  case class DBStub(tag: Tag) extends Table[StubRow](tag, "stub") {
    def pk           = column [Long]             ("pk", O.PrimaryKey, O.AutoInc)
    def workingTitle = column [String]           ("working_title")
    def section      = column [String]           ("section")
    def due          = column [Option[DateTime]] ("due")
    def assignee     = column [Option[String]]   ("assign_to")
    def composerId   = column [Option[String]]   ("composer_id")
    def contentType  = column [Option[String]]   ("content_type")
    def * = (pk, workingTitle, section, due, assignee, composerId, contentType)
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
        case ((pk, title, section, due, assignee, cId, stubContentType),
              (composerId, path, lastMod, lastModBy, status, contentType, commentable, headline, published)) =>
          DashboardRow(
            Stub(Some(pk), title, section, due, assignee, cId, stubContentType),
            WorkflowContent(
              composerId,
              path,
              headline,
              contentType,
              Some(Section(section)),
              Status(status),
              lastMod,
              lastModBy,
              commentable,
              published
            )
          )
      }

    }
}


object SectionDatabase {
  val store: Agent[Set[Section]] = Agent(Set())

  for(apiSections <- loadSectionsFromApi) store.alter(apiSections + Section("Dev"))

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
