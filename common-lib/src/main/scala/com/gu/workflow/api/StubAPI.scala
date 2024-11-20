package com.gu.workflow.api

import com.gu.workflow.lib.QueryString
import com.gu.workflow.util.StubDecorator
import io.circe.Json
import io.circe.syntax._
import models.DateFormat._
import models.api._
import models.{ContentItemIds, Flag, Stub}
import org.joda.time.{DateTime, LocalDate}
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class StubAPI(
  override val apiRoot: String,
  override val ws: WSClient
) extends ApiUtils with WSUtils {

  def createStub(body: Json): ApiResponseFt[ContentUpdate] =
    for {
      convertedJson <- flatStubJsonToStubJson(body)
      res <- ApiResponseFt.Async.Right(postRequest("stubs", convertedJson))
      json <- parseBody(res.body)
      createRes <- extractDataResponse[ContentUpdate](json)
    } yield createRes

  def putStub(stubId: Long, body: Json): ApiResponseFt[ContentUpdate] =
    for {
      convertedJson <- flatStubJsonToStubWithCollaboratorsJson(body)
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId", convertedJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[ContentUpdate](json)
    } yield putRes

  def getStub(id: Long): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs/$id"))
      json <- parseBody(res.body)
      item <- extractDataResponseOpt[Stub](json)
    } yield item

  def getStubByComposerId(stubDecorator: StubDecorator, composerId: String): ApiResponseFt[Option[Stub]] = {
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content/$composerId"))
      json <- parseBody(res.body)
      maybeStub <- extractDataResponseOpt[Stub](json)
      maybeDecoratedStub <- ApiResponseFt.Async.Right(maybeStub match {
        case Some(stub) => stubDecorator.withPrintLocationDescriptions(stub).map(Some(_))
        case _ => Future.successful(None)
      })
    } yield maybeDecoratedStub
  }

  def getStubByEditorId(editorId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"atom/$editorId"))
      json <- parseBody(res.body)
      item <- extractDataResponseOpt[Stub](json)
    } yield item

  def putStubDue(id: Long, date: Option[DateTime]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/dueDate", date.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubNote(id: Long, note: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/note", note.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubAssignee(id: Long, assignee: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assignee", assignee.asJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[Long](json)
    } yield putRes

  def putStubAssigneeEmail(id: Long, assigneeEmail: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/assigneeEmail", assigneeEmail.asJson))
      json <- parseBody(res.body)
      putRes <- extractDataResponse[Long](json)
    } yield putRes

  def putStubProdOffice(id: Long, status: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/prodOffice", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubTrashed(id: Long, trashed: Boolean): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/updateTrashed", trashed.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubLegalStatus(id: Long, status: Flag): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/needsLegal", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubPictureDesk(id: Long, status: Option[Flag]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/needsPictureDesk", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubPriority(id: Long, priority: Int): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/priority", priority.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubSection(id: Long, section: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/section", section.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubWorkingTitle(id: Long, wt: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$id/workingTitle", wt.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def putStubPlannedPublicationId(stubId: Long, plannedPublicationId: Long): ApiResponseFt[Long] =
      for {
        res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/plannedPublicationId", plannedPublicationId.asJson))
        json <- parseBody(res.body)
        item <- extractDataResponse[Long](json)
      } yield item

  def putStubPlannedBookId(stubId: Long, plannedBookId: Long): ApiResponseFt[Long] =
      for {
        res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/plannedBookId", plannedBookId.asJson))
        json <- parseBody(res.body)
        item <- extractDataResponse[Long](json)
      } yield item

  def putStubPlannedBookSectionId(stubId: Long, plannedBookSectionId: Long): ApiResponseFt[Long] =
      for {
        res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/plannedBookSectionId", plannedBookSectionId.asJson))
        json <- parseBody(res.body)
        item <- extractDataResponse[Long](json)
      } yield item

  def putStubPlannedNewspaperPageNumber(stubId: Long, plannedNewspaperPageNumber: Int): ApiResponseFt[Long] =
      for {
        res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/plannedNewspaperPageNumber", plannedNewspaperPageNumber.asJson))
        json <- parseBody(res.body)
        item <- extractDataResponse[Long](json)
      } yield item

  def putStubPlannedNewspaperPublicationDate(stubId: Long, plannedNewspaperPublicationDate: LocalDate): ApiResponseFt[Long] =
      for {
        res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/plannedNewspaperPublicationDate", plannedNewspaperPublicationDate.asJson))
        json <- parseBody(res.body)
        item <- extractDataResponse[Long](json)
      } yield item

  def putStubRightsReviewed(stubId: Long, reviewed: Boolean): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/rightsReviewed", reviewed.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def deleteContentByStubId(id: Long): ApiResponseFt[Option[String]] =
    for {
      res <- ApiResponseFt.Async.Right(deleteRequest(s"stubs/$id"))
      json <- parseBody(res.body)
      deleteRes <- extractDataResponseOpt[String](json)
    } yield deleteRes

  def updateContentStatus(stubId: Long, status: String): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/status", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def updateContentCommissionedLength(stubId: Long, commissionedLength: Option[Int]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/commissionedLength", commissionedLength.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def updateContentMissingCommissionedLengthReason(stubId: Long, missingCommissionedLengthReason: Option[String]): ApiResponseFt[Long] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"stubs/$stubId/missingCommissionedLengthReason", missingCommissionedLengthReason.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[Long](json)
    } yield item

  def updateContentStatusByComposerId(composerId: String, status: String): ApiResponseFt[String] =
    for {
      res <- ApiResponseFt.Async.Right(putRequest(s"content/$composerId/status", status.asJson))
      json <- parseBody(res.body)
      item <- extractDataResponse[String](json)
    } yield item

  def deleteStubs(composerIds: Seq[String]): ApiResponseFt[Seq[String]] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/delete", composerIds.asJson))
      json <- parseBody(res.body)
      deleteRes <- extractDataResponse[Seq[String]](json)
    } yield deleteRes

  def takeDownStubs(takedownRequest: TakedownRequest): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/takedown", takedownRequest.asJson))
      json <- parseBody(res.body)
      takeDownRes <- extractDataResponse[Int](json)
    } yield takeDownRes

  def trashStubs(stubIds: Seq[Long]): ApiResponseFt[Int] =
    for {
      res <- ApiResponseFt.Async.Right(postRequest("stubs/trash", stubIds.asJson))
      json <- parseBody(res.body)
      stubIdCount <- extractDataResponse[Int](json)
    } yield stubIdCount

  def getPublishedNotHold24Hours: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldPublished"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubsToDelete: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("oldTrashed"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubsToTrash: ApiResponseFt[List[ContentItemIds]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest("old30Days"))
      json <- parseBody(res.body)
      listRes <- extractDataResponse[List[ContentItemIds]](json)
    } yield listRes

  def getStubs(stubDecorator: StubDecorator, queryString: Map[String, Seq[String]]): ApiResponseFt[ContentResponse] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs", QueryString.flatten(queryString)))
      json <- parseBody(res.body)
      contentRes <- extractDataResponse[ContentResponse](json)
      decoratedContentRes <- ApiResponseFt.Async.Right(decorateContent(stubDecorator, contentRes))
    } yield decoratedContentRes

  def decorateStubs(stubDecorator: StubDecorator, stubs: List[Stub]): Future[List[Stub]] = Future.traverse(stubs)(stubDecorator.withPrintLocationDescriptions)

  def decorateContent(stubDecorator: StubDecorator, contentResponse: ContentResponse): Future[ContentResponse] = {
    // decoration needed here on every stub in the response!
    val decoratedEntries = contentResponse.content.toList.map(
      mapEntry => for {
        y <- decorateStubs(stubDecorator, mapEntry._2)
      } yield (mapEntry._1, y)
    )
    Future.traverse(decoratedEntries)(l => l).map(l =>
     ContentResponse(l.toMap, contentResponse.count))
  }
}
