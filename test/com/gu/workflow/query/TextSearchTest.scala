package com.gu.workflow.query

// import lib.PostgresDB
import test._
import models.ContentItem
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
// import ContentItem._

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  def testData: List[ContentItem] = List(
    contentItem(defaultStub(title = "This has the magic word, xyzzy, in it"), None),
    contentItem(defaultStub(), None)
  )

  def matchesText(s: String, testData: List[ContentItem]) =
    FilterTest(c => c.stub.title.containsSlice(s), testData)

  "TextSearch" - {
    "Should find text in stub working title" in withTestData(testData) { dataInserted =>
      val ft = matchesText("xyzzy", dataInserted)
      val query = WfQuery(text = Option("xyzzy"))
      query should selectSameResultsAs (ft)
    }
  }

}
