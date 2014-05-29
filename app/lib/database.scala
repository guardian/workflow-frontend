package lib

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import models._

import akka.agent.Agent
import play.api.libs.ws._
import play.api.libs.json.JsArray
import play.api.db._
import anorm._

import org.joda.time._
import org.joda.time.format._
import anorm._


object AnormExtension {


  val dateFormatGeneration: DateTimeFormatter = DateTimeFormat.forPattern("yyyyMMddHHmmssSS");

  implicit def rowToDateTime: Column[DateTime] = Column.nonNull { (value, meta) =>
    val MetaDataItem(qualified, nullable, clazz) = meta
    value match {
      case ts: java.sql.Timestamp => Right(new DateTime(ts.getTime, DateTimeZone.UTC))
      case d: java.sql.Date => Right(new DateTime(d.getTime, DateTimeZone.UTC))
      case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass) )
    }
  }

  implicit val dateTimeToStatement = new ToStatement[DateTime] {
    def set(s: java.sql.PreparedStatement, index: Int, aValue: DateTime): Unit = {
      s.setTimestamp(index, new java.sql.Timestamp(aValue.withMillisOfSecond(0).getMillis))
    }
  }

}

object PostgresDB {
  import play.api.Play.current
  import AnormExtension._

  def rowToStub(row: SqlRow) = Stub(
    id = Some(row[Long]("pk")),
    title = row[String]("working_title"),
    section = row[String]("section"),
    due = row[Option[DateTime]]("due"),
    assignee = row[Option[String]]("assign_to"),
    composerId = row[Option[String]]("composer_id")
  )

  def rowToContent(row: SqlRow): WorkflowContent =
    WorkflowContent(
      composerId = row[String]("composer_id"),
      path = row[Option[String]]("path"),
      workingTitle = row[String]("working_title"),
      due = Some(row[DateTime]("due")),
      assignee = row[Option[String]]("assign_to"),
      headline = row[Option[String]]("headline"),
      slug = None,
      `type` = row[String]("content_type"),
      contributors = Nil,
      section = Some(Section(row[String]("section"))),
      status = Status(row[String]("status")),
      lastModification = Some(ContentModification("", row[DateTime]("last_modified"), row[Option[String]]("last_modified_by"))),
      scheduledLaunch = None,
      stateHistory = Map.empty,
      commentable = row[Boolean]("commentable"),
      state = if (row[Boolean]("published")) ContentState.Published else ContentState.Draft
    )


  def getAllStubs: List[Stub] = DB.withConnection { implicit c =>
    SQL("select * from stub")().map(rowToStub).toList
  }

  def createStub(stub: Stub): Unit = DB.withConnection { implicit c =>
    SQL(""" INSERT INTO Stub(working_title, section, due, assign_to, composer_id)
            VALUES({working_title}, {section}, {due}, {assign_to}, {composer_id})
         """).on(
        'working_title -> stub.title,
        'section -> stub.section,
        'due -> stub.due,
        'assign_to -> stub.assignee,
        'composer_id -> stub.composerId
      ).executeUpdate
  }

  def updateStub(id: Long, stub: Stub) {
    DB.withConnection { implicit c =>
      SQL("""
            UPDATE Stub SET
            working_title = {working_title},
            section = {section},
            due = {due},
            assign_to = {assign_to},
            composer_id = {composer_id}
            WHERE pk = {pk}
          """).on(
          'pk -> id,
          'working_title -> stub.title,
          'section -> stub.section,
          'due -> stub.due,
          'assign_to -> stub.assignee,
          'composer_id -> stub.composerId
        ).executeUpdate
    }
  }

  def updateStubWithComposerId(id: Long, composerId: String) {
    DB.withConnection { implicit c =>
      SQL(
        """
          UPDATE Stub SET
          composer_id = {composer_id}
          WHERE pk = {id}
        """).on(
        'composer_id -> composerId,
        'id -> id
        ).executeUpdate
    }
  }

  def findStubByComposerId(composerId: String): Option[Stub] = {
    DB.withConnection { implicit c =>
      SQL(
        """
          SELECT * from stub WHERE
          composer_id = {composer_id}
        """
      ).on(
      'composer_id -> composerId
     )().map{ rowToStub(_) }.headOption
    }
  }

  def createOrModifyContent(wc: WorkflowContent): Unit = {
    if (updateContent(wc) == 0) createContent(wc)
  }

  def updateContent(wc: WorkflowContent): Int = {
    DB.withConnection { implicit c =>
      SQL("""
          UPDATE content SET
          path = {path},
          headline = {headline},
          last_modified = {last_modified},
          last_modified_by = {last_modified_by},
          status = {status},
          content_type = {content_type},
          commentable = {commentable},
          published = {published}
          WHERE
          composer_id = {composer_id}
          """).on(
          'composer_id -> wc.composerId,
          'path -> wc.path,
          'headline -> wc.headline,
          'last_modified -> wc.lastModification.map(_.dateTime),
          'last_modified_by -> wc.lastModification.flatMap(_.user),
          'status -> wc.status.name,
          'content_type -> wc.`type`,
          'commentable -> wc.commentable,
          'published -> (wc.state == ContentState.Published)
        ).executeUpdate()
    }
  }

  def createContent(wc: WorkflowContent): Unit = {
    DB.withConnection { implicit c =>
      SQL(
        """
          INSERT INTO content (composer_id,
                               path,
                               headline,
                               last_modified,
                               last_modified_by,
                               status,
                               content_type,
                               commentable,
                               published)
          VALUES ( {composer_id},
                   {path},
                   {headline},
                   {last_modified},
                   {last_modified_by},
                   {status},
                   {content_type},
                   {commentable},
                   {published}
                 )
        """
      ).on(
          'composer_id -> wc.composerId,
          'path -> wc.path,
          'headline -> wc.headline,
          'last_modified -> wc.lastModification.map(_.dateTime),
          'last_modified_by -> wc.lastModification.flatMap(_.user),
          'status -> wc.status.name,
          'content_type -> wc.`type`,
          'commentable -> wc.commentable,
          'published -> (wc.state == ContentState.Published)
      ).executeUpdate()
    }
  }

  def allContent: List[WorkflowContent] = DB.withConnection { implicit conn =>
    SQL("SELECT * FROM stub INNER JOIN content ON (stub.composer_id = content.composer_id)")().map(rowToContent).toList
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
    Status("Stub"),
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

