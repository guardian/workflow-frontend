package com.gu.workflow.query

import lib.PostgresDB
import models.{ContentItem, DashboardRow}
import org.scalatest.Matchers

trait FilterTestOps extends Matchers {

  case class FilterTest(p: (ContentItem) => Boolean) {
    def splitTestData(testData: List[ContentItem]): (List[ContentItem], List[ContentItem]) =
      testData.partition(p)

    def compareTo(testData: List[ContentItem], dbResult: DBResult) = {
      val (testIn, testOut) = splitTestData(testData)
      dbResult.results should contain theSameElementsAs (testIn)
      dbResult.rest should contain theSameElementsAs (testOut)
    }
  }

  case class DBResult(query: WfQuery, inputData: List[ContentItem]) {
    val results = PostgresDB.getContent(query).map(DashboardRow.toContentItem(_))
    val rest = inputData diff results
  }

}
// trait FilterTestOps extends Matchers {
//   def compare(filter: FilterTest, res: DBResult, testData: List[ContentItem]) = {
//               testData: List[ContentItem],
//               dbAll: List[ContentItem],
//               dbIn: List[ContentItem]) = {
//     val (testIn, testOut) = filter.splitTestData(testData)
//     val dbOut = dbAll diff dbIn

//     dbIn should contain theSameElementsAs (testIn)
//   }
// }
