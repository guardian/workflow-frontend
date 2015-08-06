package com.gu.workflow.query

import lib.PostgresDB
import test._
import models.ContentItem
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
// import ContentItem._

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  // field getters, here we are working with two types of fields, string
  // or optional string
  type TextField = FieldGetter[String]

  // a list of String fields that text search should look at
  val fields: List[TextField] = List(
    _.stub.title, _.stub.note, _.wcOpt.flatMap(_.headline)
  )

  def fieldCheckers(pattern: String) = fields.map { field =>
    (c: ContentItem) => field(c).map(_.containsSlice(pattern)).getOrElse(false)
  }

  // combine with or (`|`)
  def findTextOp(s: String): FieldTest = fieldCheckers(s).reduce(_ | _)

  def doTest(f: FieldTest, query: WfQuery,
             data: List[ContentItem] = testData): Unit =
    withTestData(data) { dataInserted =>
      query should selectSameResultsAs (FilterTest(f, dataInserted))
    }

  val matchStr = "xyzzy"

  val testData: List[ContentItem] = {
    val stringWithMatch = s"This has the magic word, ${matchStr}, in it"
    List(
      // just title
      contentItem(defaultStub(title = stringWithMatch), Some(defaultWorkflow())),
      // just note
      contentItem(defaultStub().copy(note = Some(stringWithMatch)), Some(defaultWorkflow())),
      // match in both title and note
      contentItem(defaultStub(title = stringWithMatch).copy(note = Some(stringWithMatch)),
                  Some(defaultWorkflow())),
      // match in headline
      contentItem(defaultStub(), Some(defaultWorkflow().copy(headline = Some(stringWithMatch)))),
      // no match
      contentItem(defaultStub(), Some(defaultWorkflow()))
    )
  }

  "TextSearch" - {

    "empty should return everything" in doTest(noFilter, WfQuery(text = None))

    "with should match against correct fields" in (
      doTest(findTextOp(matchStr), WfQuery(text = Some(matchStr)))
    )

  }

}
