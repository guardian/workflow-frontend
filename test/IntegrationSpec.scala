package test

import models.ContentItem
import models.Status
import models.Stub
import org.joda.time.DateTime
import org.scalactic.Equality
import play.api.libs.json._
import org.scalatest._
import com.gu.workflow.test.lib.TestData._

class WorkflowSpec extends FreeSpec  with  WorkflowIntegrationSuite with Inside {

  s"$host/api/content" - {
    "show content in db" in {
      val expectedTitle = "Content Item"
      val content = createContent(contentItem(defaultStub(title=expectedTitle)))

      val js: JsValue = getJs("api/content")

      val actualTitle = ((js \ "stubs").apply(0) \ "title").validate[String].asOpt.get

      expectedTitle should equal(actualTitle)
    }
  }

  s"$host/api/content?text=query" - {
    "show filter results from api" in {
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
}
