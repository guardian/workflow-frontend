package lib

import java.sql.SQLException

import com.gu.workflow.db.Schema
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

  def notValidForUpsert(contentItem: ContentItem) = {
    contentItem.stub.composerId != contentItem.wcOpt.map(_.composerId)
  }

  def createContent(c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    if(notValidForUpsert(c)) Left(ComposerIdsConflict(c.stub.composerId, c.wcOpt.map(_.composerId)))
    else createContentDB(c)

  }
  private def createContentDB(c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    DB.withTransaction { implicit session =>
      c match {
        case ContentItem(stub, None) => Right(ContentUpdate(insertStub(stub), None))
        case ContentItem(stub, Some(wc)) => createStubAndWCContent(stub, wc)
      }
    }
  }

  private def createStubAndWCContent(s: Stub, wc: WorkflowContent)(implicit session: Session): Either[ContentUpdateError, ContentUpdate] = {
    val existing = contentByComposerId(wc.composerId)
    if(existing.isDefined) Left(ContentItemExists)
    else {
      val stubId = insertStub(s)
      insertWorkflowContet(wc).right.map(insertedId => ContentUpdate(stubId, Some(insertedId)))
    }
  }

  def updateContentItem(id: Long, c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    if(notValidForUpsert(c)) Left(ComposerIdsConflict(c.stub.composerId, c.wcOpt.map(_.composerId)))
    else updateContentItemDB(id, c)
  }

  private def updateContentItemDB(id: Long, c: ContentItem): Either[ContentUpdateError, ContentUpdate] = {
    DB.withTransaction { implicit session =>
      c match {
        case ContentItem(stub, None) => {
          val updatedRows = updateStubRows(id, stub)
          if(updatedRows==0) Left(StubNotFound(id))
          else Right(ContentUpdate(id, None))
        }
        case ContentItem(stub, Some(wc)) => {
          updateStubAndInsertWc(id, stub, wc)
        }
      }
    }
  }

  private def updateStubAndInsertWc(id: Long, stub: Stub, wc: WorkflowContent)(implicit session: Session): Either[ContentUpdateError, ContentUpdate] = {
    val existing = contentByComposerId(wc.composerId)
    if(existing.isDefined) Left(ContentItemExists)
    else {
      val i = updateStubRows(id, stub)
      if(i==0) Left(StubNotFound(id))
      else {
        insertWorkflowContet(wc).right.map(insertedId => ContentUpdate(id, Some(insertedId)))
      }
    }
  }

  private def insertStub(s: Stub)(implicit session: Session): Long = (stubs returning stubs.map(_.pk) += Stub.newStubRow(s))

  private def insertWorkflowContet(wc: WorkflowContent)(implicit session: Session): Either[DatabaseError, String] = {
    try {
      Right(content returning content.map(_.composerId) += WorkflowContent.newContentRow(wc, None))
    }
    catch {
      case sqle: SQLException => Left(DatabaseError(sqle.getMessage()))
    }
  }

  def getContentById(id: Long): Option[ContentItem] = {
    DB.withTransaction { implicit session =>
      contentByStubId(id)
    }
  }

  def contentByStubId(id: Long)(implicit session: Session) = {
    (for {
      (s, c)<- stubs leftJoin content on (_.composerId === _.composerId)
      if s.pk === id
    } yield (s,  c.?)).firstOption.map { case (s, c) => {
      ContentItem(Stub.fromStubRow(s), WorkflowContent.fromOptionalContentRow(c))
    }}
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
        val content = WorkflowContent.fromContentRow(contentData)
        DashboardRow(stub, content)
      }
      dashboardRowOpt match {
        case None => Left(ApiErrors.updateError(composerId))
        case Some(d) => Right(ApiSuccess(d))
      }
    }
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

  def updateField[A](id: Long, field: A, s: Schema.DBStub => Column[A]) = {
    DB.withTransaction { implicit session =>
      stubs
        .filter(_.pk === id)
        .map(s)
        .update(field)
    }
  }

  def deleteContentByStubId(id: Long): Option[DeleteOp] = {
    DB.withTransaction { implicit session =>
      val queryCurrentStub = stubs.filter(_.pk === id)

      // Delete from Content table
      val composerRows = content.filter(c => c.composerId in queryCurrentStub.map(_.composerId)).delete

      // Delete from Stub table
      val deletedRows = queryCurrentStub.delete

      if(deletedRows==0) None

      else Some(DeleteOp(id, composerRows))

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
