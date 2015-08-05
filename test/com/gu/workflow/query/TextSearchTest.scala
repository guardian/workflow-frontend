package com.gu.workflow.query

import lib.PostgresDB
import test._
import models.ContentItem
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
// import ContentItem._

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  def findTextOp(s: String) = (
    ((c: ContentItem) => c.stub.title.containsSlice(s)) or
      (c => c.stub.note.exists(_.containsSlice(s)))
  )

  def doTest(f: FieldTest, query: WfQuery,
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

  "TextSearch" - {

    "empty should return everything" in doTest(noFilter, WfQuery(text = None))

    "with should match against correct fields" in {
      val targetString = "xyzzy"
      doTest(findTextOp(targetString), WfQuery(text = Some(targetString)))
    }
 }

}
