package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import lib.TestData._
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import models.ContentItem._

class DateRangeFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()
  lazy val now =  DateTime.now()
  lazy val oneDayAgo = DateTime.now().minusDays(1)
  val todayRange = DateRange(oneDayAgo, now)

  "Should query on date selected due times" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val wfQueryTime = WfQueryTime(Some(oneDayAgo),Some(now))
    val query = WfQuery(dueTimes=Seq(wfQueryTime))
    val dueTimeFilter = FilterTest(dateRangeOpt(due, todayRange), dataInserted)

    query should selectSameResultsAs (dueTimeFilter)
  }


  "Should return all results if only from is set" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val wfQueryTime = WfQueryTime(Some(oneDayAgo),None)
    val query = WfQuery(dueTimes=Seq(wfQueryTime))

    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Should return all results if only until element is set" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val wfQueryTime = WfQueryTime(None,Some(now))
    val query = WfQuery(dueTimes=Seq(wfQueryTime))

    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Should return all results if date range is wrong way round" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val wfQueryTime = WfQueryTime(Some(now), Some(oneDayAgo))
    val query = WfQuery(dueTimes=Seq(wfQueryTime))

    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }


  "Should query on date selected created at times" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val wfQueryTime = WfQueryTime(Some(oneDayAgo),Some(now))
    val query = WfQuery(creationTimes=Seq(wfQueryTime))
    val dueTimeFilter = FilterTest(dateRange(createdAt, todayRange), dataInserted)

    query should selectSameResultsAs (dueTimeFilter)
  }

}

