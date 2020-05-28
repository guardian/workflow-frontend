package com.gu.workflow.api

import com.gu.workflow.api.ApiUtils._
import com.gu.workflow.lib.{Caching, ContentAPI, QueryString}
import io.circe.Json
import io.circe.syntax._
import models.DateFormat._
import models.{ContentItemIds, ExternalData, Flag, Stub}
import models.api._
import org.joda.time.DateTime
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object StubAPI {

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

  private def getPlannedPrintLocationDescriptionFromStub(
                                           contentAPI: ContentAPI,
                                           stub: Option[Stub]
                                         ): Future[Option[String]] = {
    stub
      .flatMap(s => Some(s.plannedPublicationId, s.plannedBookSectionId, s.plannedBookSectionId)) match {
      case Some((Some(pId), Some(bId), Some(bsId))) => getPrintLocationDescriptionFromIds(contentAPI, pId, bId, bsId)
      case _ => Future.successful(None)
    }}

  private def getActualPrintLocationDescriptionFromExternalData(
                                           contentAPI: ContentAPI,
                                           externalData: Option[ExternalData]
                                         ): Future[Option[String]] = {
    externalData
      .flatMap(e => Some(e.actualPublicationId, e.actualBookId, e.actualBookSectionId)) match {
      case Some((Some(pId), Some(bId), Some(bsId))) => getPrintLocationDescriptionFromIds(contentAPI, pId, bId, bsId)
      case _ => Future.successful(None)
    }}

  private def getPrintLocationDescriptionFromIds(contentAPI: ContentAPI, pId: Long, bId: Long, bsId: Long): Future[Option[String]] =
    {
      for {
        publicationDescription <- contentAPI.getTagInternalName(pId)
        bookDescription <- contentAPI.getTagInternalName(bId)
        bookSectionDescription <- contentAPI.getTagInternalName(bsId)
      } yield (publicationDescription, bookDescription, bookSectionDescription) match {
        case (Some(a), Some(b), Some(c)) => Some(a + " >> " + b + " >> " + c)
        case _ => None
      }
    }

  def getStubByComposerId(contentAPI: ContentAPI, composerId: String): ApiResponseFt[Option[Stub]] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"content/$composerId"))
      json <- parseBody(res.body)
      maybeStub <- extractDataResponseOpt[Stub](json)
      maybeExternalData = maybeStub.flatMap(_.externalData)
      actualPrintLocationDescription <- ApiResponseFt.Async.Right(getActualPrintLocationDescriptionFromExternalData(contentAPI, maybeExternalData))
      plannedPrintLocationDescription <- ApiResponseFt.Async.Right(getPlannedPrintLocationDescriptionFromStub(contentAPI, maybeStub))
    } yield maybeStub.map(
      stub => stub
        .copy(
          externalData = stub.externalData.map(
            e => e.copy(actualPrintLocationDescription = actualPrintLocationDescription)
          )
        )
        .copy(
          plannedPrintLocationDescription = plannedPrintLocationDescription
        )
      )

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

  def getStubs(contentAPI: ContentAPI, queryString: Map[String, Seq[String]]): ApiResponseFt[ContentResponse] =
    for {
      res <- ApiResponseFt.Async.Right(getRequest(s"stubs", Some(QueryString.flatten(queryString))))
      json <- parseBody(res.body)
      contentRes <- extractDataResponse[ContentResponse](json)
      decoratedContentRes <- ApiResponseFt.Async.Right(decorateContent(contentAPI, contentRes))
    } yield decoratedContentRes

  def decorateStubs(contentAPI: ContentAPI, stubs: List[Stub]): Future[List[Stub]] =
    Future.traverse(stubs)(s => decorateStub(contentAPI, s))

  def decorateStub(contentAPI: ContentAPI, stub: Stub): Future[Stub] = {
    for {
      plannedPrintLocationDescription <- getPlannedPrintLocationDescriptionFromStub(contentAPI, Some(stub))
      externalData <- decorateExternalData(contentAPI, stub, stub.externalData)
    } yield (
      (externalData match {
        case maybeEd@Some(_) => stub.copy(externalData = maybeEd)
        case None => stub
      })
      .copy(plannedPrintLocationDescription = plannedPrintLocationDescription))
  }

  def decorateExternalData(contentAPI: ContentAPI, stub: Stub, externalData: Option[ExternalData]): Future[Option[ExternalData]] = {
    for {
      actualPrintLocationDescription <- getActualPrintLocationDescriptionFromExternalData(contentAPI, stub.externalData)
    } yield externalData.map( e => e.copy(actualPrintLocationDescription = actualPrintLocationDescription))
  }

  def decorateContent(contentAPI: ContentAPI, contentResponse: ContentResponse): Future[ContentResponse] = {
    // decoration needed here on every stub in the response!
    val decoratedEntries = contentResponse.content.toList.map(
      mapEntry => for {
        y <- decorateStubs(contentAPI, mapEntry._2)
      } yield (mapEntry._1, y)
    )
    Future.traverse(decoratedEntries)(l => l).map(l =>
     ContentResponse(l.toMap, contentResponse.count))
  }


}
