package com.gu.workflow.util

import com.gu.workflow.lib.ContentAPI
import models.Stub

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

case class DecoratedPrintLocation(
  shortDescription: String,
  longDescription: Option[String]
)

class StubDecorator(contentAPI: ContentAPI) {
  def withPrintLocationDescriptions(stub: Stub): Future[Stub] = {
    for {
      initiallyDecorated <- addActualPrintInfo(stub)
      fullyDecorated <- addPlannedPrintInfo(initiallyDecorated)
    } yield fullyDecorated
  }

  private def addActualPrintInfo(stub: Stub): Future[Stub] = {
    for {
      maybePrintInfo <- getDecoratedActualInfo(stub)
    } yield maybePrintInfo.map(printInfo => stub.copy(
      externalData = stub.externalData.map(extData => extData.copy(
        longActualPrintLocationDescription = printInfo.longDescription,
        shortActualPrintLocationDescription = Some(printInfo.shortDescription)
      ))
    )).getOrElse(stub)
  }

  private def addPlannedPrintInfo(stub: Stub): Future[Stub] = {
    for {
      maybePrintInfo <- getDecoratedPlannedInfo(stub)
    } yield maybePrintInfo.map(printInfo => stub.copy(
      longPlannedPrintLocationDescription = printInfo.longDescription,
      shortPlannedPrintLocationDescription = Some(printInfo.shortDescription)
    )).getOrElse(stub)
  }

  private def getDecoratedActualInfo(stub: Stub): Future[Option[DecoratedPrintLocation]] = stub.externalData match {
    case Some(externalData) if externalData.actualBookId.isDefined && externalData.actualBookSectionId.isDefined => {
      getDecoratedPrintLocation(externalData.actualBookId.get, externalData.actualBookSectionId.get)
    }
    case _ => Future.successful(None)
  }

  private def getDecoratedPlannedInfo(stub: Stub): Future[Option[DecoratedPrintLocation]] = {
    (stub.plannedBookId, stub.plannedBookSectionId) match {
      case (Some(bookId), Some(bookSectionId)) => getDecoratedPrintLocation(bookId, bookSectionId)
      case _ => Future.successful(None)
    }
  }

  private def getDecoratedPrintLocation(bookId: Long, bookSectionId: Long): Future[Option[DecoratedPrintLocation]] = {
    for {
      maybeBook <- contentAPI.getTagInternalName(bookId)
      maybeBookSection <- contentAPI.getTagInternalName(bookSectionId)
    } yield (maybeBook, maybeBookSection) match {
      case (Some(book), Some(bookSection)) => Some(DecoratedPrintLocation(bookSection, Some(s"$book >> $bookSection")))
      case (_, Some(bookSection)) => Some(DecoratedPrintLocation(bookSection, None))
      case _ => None
    }
  }
}
