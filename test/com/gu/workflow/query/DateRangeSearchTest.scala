package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import lib.TestData._



class DateRangeSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()

  lazy val now =  DateTime.now()
  lazy val oneDayAgo = DateTime.now().minusDays(1)
  lazy val twoDaysAgo = DateTime.now().minusDays(2)

  val todayRange = DateRange(oneDayAgo, now)
  val yesterdayRange = DateRange(twoDaysAgo, oneDayAgo)

  "No date range set" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Date range set for today" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(viewTimes = Some(todayRange))
    query should selectSameResultsAs (FilterTest(dateFields(todayRange), dataInserted))
  }

  "Date range set for yesterday" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(viewTimes = Some(yesterdayRange))
    query should selectSameResultsAs (FilterTest(dateFields(yesterdayRange), dataInserted))
  }


}
