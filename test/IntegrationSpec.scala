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

  // this is a 'read-only' test so there's no need to clear the DB after each test
  override def clearContentHook = ()

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

  /* specify the equality by which a JsObject is considered to be the
   * same as a ContentItem instance, in other words, for each
   * candidate, extract some appropriate fields and compare their
   * values. */
  val jsonContentEquality = new Equality[JsObject] {
    def compareField[A](field: String, value: A, obj: JsObject)(implicit r: Reads[A]): Boolean =
      ((obj \ field).as[A] == value)

    def areEqual(obj: JsObject, any: Any) = any match {
      case contentItem: ContentItem =>
        val content = contentItem.wcOpt.get
        val stub = contentItem.stub
        (compareField("composerId", content.composerId, obj) &&
           compareField("stubId", stub.id.get, obj))
      case _ => false
    }
  }

  "api response for getContent" - {
    val unprocessedTestData = generateTestData().filterNot(_.stub.trashed)

    withTestData(unprocessedTestData) { testData =>

      /* we need to override the implicit reads here that come from the
       * companion objects (which is also searched for implicits; news
       * to me ...) as they don't represent the format that we are
       * expecting to output to the API. Currently the actual output
       * (Writes[Stub]) just uses the default generated format, so the
       * default generated Reads[Stub] should be enough to read it back
       * again.
       */

      implicit val dateFormat = models.DateFormat
      implicit val stubReads  = Json.reads[Stub]

      "stub field should contain the content-less stubs" in {
        val expectedStubs = testData.filter(_.wcOpt.isEmpty).map(_.stub)

        val js = getJs("api/content")
        val actualStubs = (js \ "stubs").as[List[Stub]]
        actualStubs should contain theSameElementsAs (expectedStubs)
      }

      "content field should" - {

        /* these need to be lazy as they can't accessed until we are actually
         * in a test, and the FakeApp is running (and the DB is accessible) */

        lazy val itemsByStatus =
          testData.groupBy(_.wcOpt.map(_.status.name).getOrElse("Stub"))

        lazy val js = (getJs("api/content") \ "content").as[JsObject]

        "contain the correct statuses" in {
          val expectedStatuses = itemsByStatus.keySet.filterNot(_ == "Stub")
          val actualStatuses = js.keys
          actualStatuses should contain theSameElementsAs (expectedStatuses)
        }

        // our list of statuses is correct, now check the contents attached to each status
        // js.keys.foreach { key =>
        //   val expectedItems = itemsByStatus(key)
        //   val actualItems = (js \ key).as[List[ContentItem]]
        //   //        (actualItems should contain theSameElementsAs (expectedItems)) (decided by jsonContentEquality)
        //}

        "contain the correct counts summary" in pending

      }
    }
  }
}
