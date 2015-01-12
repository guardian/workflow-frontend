package lib

import lib.OrderingImplicits._
import models.ApiResponse.ApiResponse
import models.Flag.Flag
import models._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time.DateTime
import play.api.libs.json.{JsObject, Writes}
import scala.slick.driver.PostgresDriver.simple._
import com.gu.workflow.db.Schema._
import com.gu.workflow.syntax._
import com.gu.workflow.db.CommonDB._
import com.gu.workflow.query._

object PostgresDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getContent(
                  section:      Option[List[Section]]  = None,
                  desk:         Option[Desk]     = None,
                  dueFrom:      Option[DateTime] = None,
                  dueUntil:     Option[DateTime] = None,
                  status:       Option[Status]   = None,
                  contentType:  Option[String]   = None,
                  published:    Option[Boolean]  = None,
                  flags:        Seq[String]      = Nil,
                  prodOffice:   Option[String]   = None,
                  createdFrom:  Option[DateTime] = None,
                  createdUntil: Option[DateTime] = None
  ): List[DashboardRow] =
    getContent(WfQuery.fromOptions(
                 section, desk, dueFrom, dueUntil, status, contentType,
                 published, flags, prodOffice, createdFrom, createdUntil
               )
    )

  def getContent(q: WfQuery): List[DashboardRow] =
    DB.withTransaction { implicit session =>

      val query = for {
        s <- WfQuery.stubsQuery(q)
        c <- WfQuery.contentQuery(q)
        if s.composerId === c.composerId
      } yield (s, c)

      query.filter( {case (s,c) => displayContentItem(s, c) })
           .list.map {
            case (stubData, contentData) =>
          val stub    = Stub.fromStubRow(stubData)
          val content = WorkflowContent.fromContentRow(contentData)

          DashboardRow(stub, content)
      }
    }

  def getContentItems(q: WfQuery): ApiResponse[List[ContentItem]] = {
    DB.withTransaction { implicit session =>
      //todo - make this an left outer join
      val q1 = for {
        s<- WfQuery.stubsQuery(q)
        c<- WfQuery.contentQuery(q)
        if(s.composerId ===c.composerId)
      } yield (s,c)

      val getStubs: Boolean= (q.status.isEmpty || q.status.exists(_ == models.Status("Stub"))) && q.published != Some(true)

      val q2 = for {
        s <- WfQuery.stubsQuery(q)
        if s.composerId.isEmpty
      } yield s

      val list1 = q1.filter( {case (s,c) => displayContentItem(s, c) })
        .list.map {
        case (stubData, contentData) =>
          val stub    = Stub.fromStubRow(stubData)
          val content = WorkflowContent.fromContentRow(contentData)

          ContentItem(stub, Some(content))
      }
      val list2 = q2.filter({case s => dueDateNotExpired(s.due)})
        .list.map(row => ContentItem(Stub.fromStubRow(row), None))

      val lists = list1 ::: list2
//      todo - sort out ordering
//      val publishedContent = lists.filter(c => c.wc.status == models.Status("Final"))
//        .sortBy(s => (s.wc.timePublished, s.wc.lastModified))(publishedOrdering)
//      val unpublishedContent = lists.filterNot(d => d.wc.status == models.Status("Final"))
//        .sortBy(d => (d.stub.priority, d.stub.due))(unpublishedOrdering)

      Right(list1 ::: list2)
    }
  }

  private def ensureContentExistsWithId(composerId: String, contentType: String, activeInInCopy: Boolean = false)(implicit session: Session) {
    val contentExists = content.filter(_.composerId === composerId).exists.run
    if(!contentExists) {
      val wc = WorkflowContent.default(composerId: String, contentType: String, activeInInCopy)
      content += WorkflowContent.newContentRow(wc, None)
    }
  }


  /**
   * Creates a new content item in Workflow.
   *
   * @param stub
   * @param contentItem
   * @return Either: Left(Long) if item exists already with composerId.
   *         Right(Long) of newly created item.
   */
  def createContent(contentItem: ContentItem): ApiResponse[Long] = {
    DB.withTransaction { implicit session =>

      val existing = contentItem.wcOpt.flatMap(wc => (for (s <- stubs if s.composerId === wc.composerId) yield s.pk).firstOption)

      existing match {
        case Some(stubId) => Left(ApiError("StubExists",s"Stub ${stubId} already exists", 409, "conflict"))
        case None => {
          contentItem.wcOpt.foreach(
            content += WorkflowContent.newContentRow(_, None)
          )

          Right((stubs returning stubs.map(_.pk)) += Stub.newStubRow(contentItem.stub))
        }
      }
    }
  }

  def getContentByComposerId(composerId: String): ApiResponse[DashboardRow] = {
    DB.withTransaction { implicit session =>

      val query = for {
        s <- stubs.filter(_.composerId === composerId)
        c <- content
        if s.composerId === c.composerId
      } yield (s, c)

      val dashboardRowOpt = query.firstOption map {case (stubData, contentData) =>
        val stub    = Stub.fromStubRow(stubData)
        val content = WorkflowContent.fromContentRow(contentData).copy(
          section = Some(Section(stub.section))
        )
        DashboardRow(stub, content)
      }
      dashboardRowOpt match {
        case None => Left(ApiError("ComposerIdNotFound", s"Composer Id ${composerId} does not exist", 404, "notfound"))
        case Some(d) => Right(d)
      }
    }
  }

  def updateStub(id: Long, stub: Stub) {
    DB.withTransaction { implicit session =>

      stub.composerId.foreach(ensureContentExistsWithId(_, stub.contentType.getOrElse("article")))

      stubs
        .filter(_.pk === id)
        .map(s => (s.workingTitle, s.section, s.due, s.assignee, s.composerId, s.contentType, s.priority, s.prodOffice, s.needsLegal, s.note))
        .update((stub.title, stub.section, stub.due, stub.assignee, stub.composerId, stub.contentType, stub.priority, stub.prodOffice, stub.needsLegal, stub.note))
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

  def updateStubDueDate(id: Long, dueDate: Option[DateTime]): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.due)
        .update(dueDate)
    }
  }

  def updateStubNote(id: Long, input: String): Int = {
    val note: Option[String] = if(input.length > 0) Some(input) else None
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.note)
        .update(note)
    }
  }

  def updateStubProdOffice(id: Long, prodOffice: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.prodOffice)
        .update(prodOffice)
    }
  }

  def updateStubSection(id: Long, section: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.section)
        .update(section)
    }
  }

  def updateStubWorkingTitle(id: Long, workingTitle: String): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.workingTitle)
        .update(workingTitle)
    }
  }

  def updateStubPriority(id: Long, priority: Int): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.priority)
        .update(priority)
    }
  }

  def updateStubLegalStatus(id: Long, status: Flag): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.needsLegal)
        .update(status)
    }
  }

  def stubLinkedToComposer(id: Long): Boolean = {
    DB.withTransaction { implicit session =>
      val q = stubs.filter(stub => stub.pk === id && stub.composerId.isDefined)
      q.length.run > 0
    }
  }

  def deleteStub(id: Long) {
    DB.withTransaction { implicit session =>

      archiveContentQuery((s, c) => s.pk === id)

      val queryCurrentStub = stubs.filter(_.pk === id)

      // Delete from Content table
      content.filter(c => c.composerId in queryCurrentStub.map(_.composerId)).delete

      // Delete from Stub table
      queryCurrentStub.delete
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
}
