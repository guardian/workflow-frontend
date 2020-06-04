package com.gu.workflow.util

import com.gu.workflow.lib.ContentAPI
import com.gu.workflow.test.lib.TestData
import models.{ExternalData, Stub}
import org.joda.time.LocalDate
import org.scalamock.scalatest.MockFactory
import org.scalatest.OneInstancePerTest
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers
import play.api.libs.ws.WSClient

import scala.concurrent.duration.{Duration, SECONDS}
import scala.concurrent.{Await, ExecutionContext, Future}

class StubDecoratorTest extends AnyFreeSpec with MockFactory with Matchers with OneInstancePerTest {
  val initialStub: Stub = TestData.defaultStub().copy(externalData = None)

  val initialExternalData: ExternalData = ExternalData(
    actualPublicationId = Some(1L),
    actualBookId = Some(1L),
    actualBookSectionId = Some(1L),
    actualNewspaperPageNumber = Some(1),
    actualNewspaperPublicationDate = Some(LocalDate.now())
  )

  val wsClient = mock[WSClient]
  
  class MockableContentApi extends ContentAPI("test", "test", wsClient)

  val contentApi: ContentAPI = stub[MockableContentApi]
  (contentApi.getTagInternalName (_: Long)(_:ExecutionContext)).when(*, *).returns(Future.successful(Some("internal-tag-name")))

  val decorator = new StubDecorator(contentApi)

  "A stub with actual print information should be decorated" in {
    val stub = initialStub.copy(externalData = Some(initialExternalData))

    val decoratedStub = Await.result(decorator.withPrintLocationDescriptions(stub), Duration(5, SECONDS))
    val decoratedExternalData = decoratedStub.externalData.get

    decoratedExternalData.longActualPrintLocationDescription shouldBe Some("internal-tag-name >> internal-tag-name")
    decoratedExternalData.shortActualPrintLocationDescription shouldBe Some("internal-tag-name")

    decoratedStub.longPlannedPrintLocationDescription shouldBe None
    decoratedStub.shortPlannedPrintLocationDescription shouldBe None
  }

  "A stub with planned print information should be decorated" in {
    val stub = initialStub.copy(
      plannedPublicationId = Some(1L),
      plannedBookId = Some(1L),
      plannedBookSectionId = Some(1L),
      plannedNewspaperPageNumber = Some(1),
      plannedNewspaperPublicationDate = Some(LocalDate.now())
    )

    val decoratedStub = Await.result(decorator.withPrintLocationDescriptions(stub), Duration(5, SECONDS))

    decoratedStub.longPlannedPrintLocationDescription shouldBe Some("internal-tag-name >> internal-tag-name")
    decoratedStub.shortPlannedPrintLocationDescription shouldBe Some("internal-tag-name")

    decoratedStub.externalData shouldBe None
  }

  "A stub with both actual and planned print information should be decorated" in {
    val stub = initialStub.copy(
      plannedPublicationId = Some(1L),
      plannedBookId = Some(1L),
      plannedBookSectionId = Some(1L),
      plannedNewspaperPageNumber = Some(1),
      plannedNewspaperPublicationDate = Some(LocalDate.now())
    ).copy(externalData = Some(initialExternalData))

    val decoratedStub = Await.result(decorator.withPrintLocationDescriptions(stub), Duration(5, SECONDS))

    val decoratedExternalData = decoratedStub.externalData.get

    decoratedExternalData.longActualPrintLocationDescription shouldBe Some("internal-tag-name >> internal-tag-name")
    decoratedExternalData.shortActualPrintLocationDescription shouldBe Some("internal-tag-name")

    decoratedStub.longPlannedPrintLocationDescription shouldBe Some("internal-tag-name >> internal-tag-name")
    decoratedStub.shortPlannedPrintLocationDescription shouldBe Some("internal-tag-name")
  }
}
