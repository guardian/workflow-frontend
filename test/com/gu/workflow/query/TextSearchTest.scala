package com.gu.workflow.query

import lib.PostgresDB
import test._
import models.ContentItem
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
import com.gu.workflow.test.lib.TestData._
import ContentItem._
import com.gu.workflow.test.WorkflowIntegrationSuite

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  // field getters, here we are working with two types of fields, string
  // or optional string
  type TextField = FieldGetter[Option[String]]

  // some text fields are optional and it's simpler to treat them all
  // the same by converting non optional fields to Some(_) (this could
  // be implicit but it's not used often enough to make it worth the
  // ensuing confusion)
  def toOpt(f: FieldGetter[String]): TextField = (c: ContentItem) => Some(f(c))

  // a list of String fields that text search should look at
  val fields: List[TextField] = List(
    toOpt(_.stub.title), _.stub.note, _.wcOpt.flatMap(_.headline)
  )

  // for matching a text field, we want to use the `stringContains`
  // operator to find out whether the field contains the pattern that
  // we are matching (filtering) against, converted to handle the
  // optional fields
  def textSearchOp(pattern: String) = optTest(stringContains(pattern))

  // so we can now combine each field getters and the data test to
  // produce a list of `FieldTest`s ...
  def textSearchTest(pattern: String) = {
    val tests = fields map (fieldTest(_, textSearchOp(pattern)))
    // ... and then use the `|` (or) combinator to bring them together into
    // a single test.
    tests.reduce(_ | _)
  }

  def doTest(f: FieldTest, query: WfQuery,
             data: List[ContentItem] = testData): Unit =
    withTestData(data) { dataInserted =>
      query should selectSameResultsAs (FilterTest(f, dataInserted))
    }

  val matchStr = "titl"
  val nonExistantStr = "xy"


  val testData: List[ContentItem] = generateTestData()

  "TextSearch" - {

    "empty should return everything" in doTest(noFilter, WfQuery(text = None))

    "with should match against correct fields" in {
      doTest(textSearchTest(matchStr), WfQuery(text = Some(matchStr)))
    }

    "should return no results if string doesnt exist" in (
        doTest(noResults, WfQuery(text=Some(nonExistantStr)))
      )

  }

}
