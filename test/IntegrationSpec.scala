package test

import models.ContentItem
import models.Status
import play.api.libs.json._
import org.scalatest._
import com.gu.workflow.test.lib.TestData._

class WorkflowSpec extends FreeSpec  with  WorkflowIntegrationSuite with Inside {
  s"$host/api/content" - {
    "show content in db" ignore {
      val expectedTitle = "Content Item"
      val content = createContent(contentItem(defaultStub(title=expectedTitle)))

      val js: JsValue = getJs("api/content")

      val actualTitle = ((js \ "stubs").apply(0) \ "title").validate[String].asOpt.get

      expectedTitle should equal(actualTitle)
    }
  }

  s"$host/api/content?text=query" - {
    "show filter results from api" ignore {
      createContent(contentItem(defaultStub(title="Foo")))
      createContent(contentItem(defaultStub(title="Bar")))

      val includedStubs = (getJs(s"api/content?text=Foo") \ "stubs").as[JsArray]
      val excludedStubs = (getJs(s"api/content?text=Bar") \ "stubs").as[JsArray]

      includedStubs.productArity should equal(1)
      excludedStubs.productArity should equal(1)

      val includedTitle = (includedStubs.apply(0) \ "title").validate[String].asOpt.get
      val excludedTitle = (excludedStubs.apply(0) \ "title").validate[String].asOpt.get

      includedTitle should equal("Foo")
      excludedTitle should equal("Bar")
    }
  }

  def extractSubField[A](js: JsValue, fieldName: String, subFieldName: String)(implicit r: Reads[A]): List[A] =
    (js \ fieldName).as[List[JsValue]].map(jsStub => (jsStub \ subFieldName).as[A])

  def jsonShouldMatch(contentItem: ContentItem, json: JsValue) = json match {
    case obj: JsObject =>
      val stub = contentItem.stub
      val content = contentItem.wcOpt.get
      (json \ "composerId") should equal (content.composerId)
    case _ =>
      fail("JSON contentItem wasn't even an object")
  }

  "api response for getContent" - {
    val unprocessedTestData = generateTestData().filterNot(_.stub.trashed)

    "stub field should contain the content-less stubs" in withTestData(unprocessedTestData) { testData =>
      val expectedStubs = testData.filter(_.wcOpt.isEmpty).map(_.stub.id).flatten

      val js = getJs("api/content")
      val actualStubs = extractSubField[Long](js, "stubs", "id")

      actualStubs should contain theSameElementsAs (expectedStubs)
    }

    "content field should contain the content items" in withTestData(unprocessedTestData) { testData =>
      def itemsWithStatus(name: String) =
        testData.filter(_.wcOpt.exists(_.status.name == name)).sortBy(_.wcOpt.map(_.composerId).getOrElse("*"))

      val js = (getJs("api/content") \ "content").as[JsObject]

      val expectedStatuses = (for(i <- testData; c <- i.wcOpt) yield c.status.name).toSet
      val actualStatuses = js.keys
      actualStatuses should contain theSameElementsAs (expectedStatuses)
    }
  }
}
