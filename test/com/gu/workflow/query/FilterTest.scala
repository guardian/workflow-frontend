package com.gu.workflow.query

import lib.PostgresDB
import models.{ContentItem, DashboardRow}
import org.scalatest.Matchers
import org.scalatest.matchers.{Matcher, MatchResult}

trait FilterTestOps extends Matchers {

  type Content = List[ContentItem]

  case class FilterTest(p: (ContentItem) => Boolean) {
    def splitTestData(testData: Content): (Content, Content) =
      testData.partition(p)

    def compareTo(testData: Content, dbResult: DBResult): Boolean = {
      val (testIn, testOut) = splitTestData(testData)
      (dbResult.results sameElements testIn) && (dbResult.rest sameElements testOut)
    }

    def matchWith(testData: Content, dbResult: DBResult): MatchResult = {
      val (testIn, testOut) = splitTestData(testData)
      MatchResult(
        compareTo(testData, dbResult),
        s"Result from database (${dbResult.results}) did not contain expected elements (${testOut})",
        s"Result from database (${dbResult.results}) contained unexpected elements (" +
          testOut diff dbResult.results + ")"
      )
    }
  }

  case class DBResult(query: WfQuery, inputData: Content) {
    val results = PostgresDB.getContent(query).map(DashboardRow.toContentItem(_))
    val rest = inputData diff results
  }

  class DBResultMatcher(filterTest: FilterTest, testData: Content) extends Matcher[DBResult] {
    def apply(dbResult: DBResult) = filterTest.matchWith(testData, dbResult)
  }

  def selectSameResultsAs(filterTest: FilterTest, testData: Content) =
    new DBResultMatcher(filterTest, testData)

}
// trait FilterTestOps extends Matchers {
//   def compare(filter: FilterTest, res: DBResult, testData: Content) = {
//               testData: Content,
//               dbAll: Content,
//               dbIn: Content) = {
//     val (testIn, testOut) = filter.splitTestData(testData)
//     val dbOut = dbAll diff dbIn

//     dbIn should contain theSameElementsAs (testIn)
//   }
// }
