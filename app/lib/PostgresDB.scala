package lib

import java.sql.SQLException

import com.wordnik.swagger.annotations.ApiResponses
import lib.OrderingImplicits._
import Response.Response
import models.Flag.Flag
import models._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json.{Json, JsObject, Writes}
import scala.slick.collection.heterogenous._
import syntax._
import scala.slick.driver.PostgresDriver.simple._
import com.gu.workflow.db.Schema._
import com.gu.workflow.syntax._
import com.gu.workflow.db.CommonDB._
import com.gu.workflow.query._

object PostgresDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def contentItemLookup(composerId: String): List[DashboardRow] =
    DB.withTransaction { implicit session =>
      WfQuery.contentLookup(composerId)
        .filter( {case (s,c) => ContentItem.visibleOnUi(s, c) })
        .list.map { case (stubData, contentData) =>
        val stub    = Stub.fromStubRow(stubData)
        val content = WorkflowContent.fromContentRow(contentData)
        DashboardRow(stub, content)
      }
    }

  def getContentItems(query: WfQuery): List[ContentItem] = {
    val dbRes = getContentItemsDBRes(WfQuery.stubAndContentFilters(query), WfQuery.stubAndCollaboratorPredOpt(query))
    val content: List[ContentItem] = dbRes.map { case (s, c) => {
      ContentItem(Stub.fromStubRow(s), WorkflowContent.fromOptionalContentRow(c))
    }}
    content
  }

  def getContentItemsDBRes(scFilters: (DBStub, DBContent) => Column[Option[Boolean]], collFilters: Option[(DBStub, DBCollaborator) => Column[Option[Boolean]]]) = {
    DB.withTransaction { implicit session =>
      val stubsAndContentQ = for {
        (s, c) <- stubs.sortBy(s => (s.priority.desc, s.workingTitle)) leftJoin content on (_.composerId === _.composerId)
        if(scFilters(s,c))
      } yield (s,  c.?)
      val fullQ = collFilters.fold(stubsAndContentQ)(pred =>
        for {
          (s,c) <- stubsAndContentQ
          (ys, yc) <- stubs outerJoin collaboratorTableQuery on (_.composerId === _.composer_id)
          if(pred(s,yc))
          if (ys.composerId === s.composerId)
        } yield (s, c)
      )
      Logger.info(fullQ.selectStatement)
      fullQ.list.distinct

    }
  }

  /**
   * Creates a new content item in Workflow.
   *
   * @param stub
   * @param contentItem
   * @return Option[Long]: None if item exists already with composerId.
   *         Some(Long) of newly created item.
   */


  def createContent(contentItem: ContentItem): Option[ContentUpdate] = {
    DB.withTransaction { implicit session =>

      val existing = contentItem.wcOpt.flatMap(wc => existingItem(wc.composerId))

      existing match {
        case Some(stubId) => None
        case None => {
          val stubId = ((stubs returning stubs.map(_.pk)) += Stub.newStubRow(contentItem.stub))
          val composerId = contentItem.wcOpt.map(content returning content.map(_.composerId) += WorkflowContent.newContentRow(_, None))
          Some(ContentUpdate(stubId, composerId, updatedRows=0))
        }
      }
    }
  }

  def existingItem(composerId: String)(implicit session: Session): Option[Long] = {
    (for (s <- stubs if s.composerId === composerId) yield s.pk).firstOption
  }


  def getContentById(id: Long): Option[ContentItem] = {
    DB.withTransaction { implicit session =>
      (for {
        (s, c)<- stubs leftJoin content on (_.composerId === _.composerId)
        if s.pk === id
      } yield (s,  c.?)).firstOption.map { case (s, c) => {
        ContentItem(Stub.fromStubRow(s), WorkflowContent.fromOptionalContentRow(c))
      }}
    }
  }


  def getContentByCompserId(composerId: String): Option[ContentItem] = {
    DB.withTransaction { implicit session =>
      (for {
        (s, c)<- stubs leftJoin content on (_.composerId === _.composerId)
        if s.composerId === composerId
      } yield (s,  c.?)).firstOption.map { case (s, c) => {
        ContentItem(Stub.fromStubRow(s), WorkflowContent.fromOptionalContentRow(c))
      }}
    }
  }

  def getDashboardRowByComposerId(composerId: String): Response[DashboardRow] = {
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
        case None => Left(ApiErrors.composerIdNotFound(composerId))
        case Some(d) => Right(ApiSuccess(d))
      }
    }
  }

  def existingWorkflowItem(id: Long)(implicit session: Session): Option[String] = {
    (for {
      (s, c) <- (stubs leftJoin content on (_.composerId === _.composerId))
      if (s.pk === id)
    } yield c.composerId.?).firstOption.flatten
  }

  def getWorkflowItem(composerId: String): Option[String] = {
    DB.withTransaction { implicit session =>
      (for {
        c <- content
        if(c.composerId === composerId)
      } yield c.composerId).firstOption
    }

  }

  def updateStubRows(id: Long, stub: Stub)(implicit session: Session):  Int = {
      stubs
        .filter(_.pk === id)
        .map(s => (s.workingTitle, s.section, s.due, s.assignee, s.assigneeEmail, s.composerId, s.contentType, s.priority, s.prodOffice, s.needsLegal, s.note))
        .update((stub.title, stub.section, stub.due, stub.assignee, stub.assigneeEmail, stub.composerId, stub.contentType, stub.priority, stub.prodOffice, stub.needsLegal, stub.note))
  }

  def insertWorkflowContet(wc: WorkflowContent)(implicit session: Session): Either[DatabaseError, String] = {
    try {
      Right(content returning content.map(_.composerId) += WorkflowContent.newContentRow(wc, None))
    }
    catch {
      case sqle: SQLException => Left(DatabaseError(sqle.getMessage()))
    }
  }

  def validateContentItemForUpsert(contentItem: ContentItem) = {
    contentItem.stub.composerId != contentItem.wcOpt.map(_.composerId)
  }


  def updateContentItem(id: Long, c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    if(validateContentItemForUpsert(c)) Left(ComposerIdsConflict(c.stub.composerId, c.wcOpt.map(_.composerId)))
    else {
      updateContentItemDB(id, c)
    }
  }


  private def updateContentItemDB(id: Long, c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    DB.withTransaction { implicit session =>
      c match {
        case ContentItem(stub, None) => {
          val updatedRows = updateStubRows(id, stub)
          if(updatedRows==0) Left(StubNotFound(id))
          else Right(ContentUpdate(id, None, updatedRows))
        }
        case ContentItem(stub, Some(wc)) => {
          updateStubAndInsertWc(id, stub, wc)
        }
      }
    }

  }

  private def updateStubAndInsertWc(id: Long, stub: Stub, wc: WorkflowContent)(implicit session: Session): Either[ContentUpdateError, ContentUpdate] = {
    val existingContentItem = existingWorkflowItem(id)
    if(existingContentItem.isDefined) Left(ContentItemExists)
    else {
      val i = updateStubRows(id, stub)
      if(i==0) Left(StubNotFound(id))
      else {
        insertWorkflowContet(wc).right.map(insertedId => ContentUpdate(id, Some(insertedId), i))
      }
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

  def updateStubWithAssigneeEmail(id: Long, assigneeEmail: Option[String]): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.assigneeEmail)
        .update(assigneeEmail)
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

  def updateStubPriority(id: Long, priority: Int): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.priority)
        .update(priority)
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

  def updateStubTrashed(id: Long, trashed: Option[Boolean]): Int = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s => s.trashed)
        .update(trashed)
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


  //todo - rename to delete contentitem
  def deleteStub(id: Long): Response[Long] = {
    DB.withTransaction { implicit session =>
      val queryCurrentStub = stubs.filter(_.pk === id)

      // Delete from Content table
      content.filter(c => c.composerId in queryCurrentStub.map(_.composerId)).delete

      // Delete from Stub table
      val deleted = queryCurrentStub.delete
      if(deleted == 0) Right(ApiSuccess(id)) else Left(ApiErrors.notFound)
    }
  }

  def updateContentStatus(status: String, composerId: String): Int = {
    DB.withTransaction { implicit session =>
      val q = for {
        wc <- content if wc.composerId === composerId
      } yield wc.status
      val updatedRow = q.update(status)
      stubs.filter(_.composerId === composerId).map(_.lastModified).update(DateTime.now())
      updatedRow
    }
  }
}
