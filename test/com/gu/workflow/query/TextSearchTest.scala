package com.gu.workflow.query

import lib.PostgresDB
import test._
import models.ContentItem
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
// import ContentItem._

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  def doTest(f: ContentItem => Boolean,
             query: WfQuery,
             data: List[ContentItem] = testData): Unit =
    withTestData(data) { dataInserted =>
      query should selectSameResultsAs (FilterTest(f, dataInserted))
    }

  def testData: List[ContentItem] = List(
    contentItem(defaultStub(title = "This has the magic word, xyzzy, in it"),
                Some(defaultWorkflow())),
    contentItem(defaultStub().copy(note = Some("This has the magic word, xyzzy, in it")),
                Some(defaultWorkflow())),
    contentItem(defaultStub(), Some(defaultWorkflow()))
  )

  def matchesText(s: String, testData: List[ContentItem]) = {
    val op = ((c: ContentItem) => c.stub.title.containsSlice(s)) or (c => c.stub.note.exists(_.containsSlice(s)))
    FilterTest(op, testData)
  }

  "TextSearch" - {
    "Should find text in stub working title" in withTestData(testData) { dataInserted =>
      val ft = matchesText("xyzzy", dataInserted)
      val query = WfQuery(text = Option("xyzzy"))
      query should selectSameResultsAs (ft)
    }

    "Should find text in note" in withTestData(testData) { dataInserted =>
      val ft = matchesText("xyzzy", dataInserted)
      val query = WfQuery(text = Option("xyzzy"))
      query should selectSameResultsAs (ft)
    }

    "Empty search sanity check" in doTest(noFilter, WfQuery())
  }

}
