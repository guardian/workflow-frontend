package test

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

  "api response for getContent" - {
    val unprocessedTestData = generateTestData().filterNot(_.stub.trashed)

    "stub field should contain the content-less stubs" in withTestData(unprocessedTestData) { testData =>
      val expectedStubs = testData.filter(_.wcOpt.isEmpty).map(_.stub.id).flatten

      val js = getJs("api/content")
      val actualStubs = extractSubField[Long](js, "stubs", "id")

      actualStubs should contain theSameElementsAs (expectedStubs)
    }

    "content field should contain the expected statuses" in withTestData(unprocessedTestData) { testData =>
      val expectedStatuses =
        (for(i <- testData; c <- i.wcOpt) yield c.status.name).toSet

      val js = getJs("api/content")
      val actualStatuses = (js \ "content")
        .as[JsObject].fieldSet.map { case (key, value) => key }

      actualStatuses should contain theSameElementsAs (expectedStatuses)
    }

  }
}
