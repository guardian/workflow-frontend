package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import com.gu.workflow.test.lib.TestData._
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import com.gu.workflow.test.WorkflowIntegrationSuite
import models.ContentItem._

class DateRangeFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()
  lazy val now =  DateTime.now()
  lazy val oneDayAgo = DateTime.now().minusDays(1)
  val todayRange = DateRange(oneDayAgo, now)

  val withinRange: (DateRange, DateTime) => Boolean = (dr,d) => (d isAfter dr.from) && (d isBefore dr.until)

  "Should query on date selected times" - {
    "field is due" in {
      val dataInserted = testData.map(createContent(_))
      val wfQueryTime = WfQueryTime(Some(oneDayAgo),Some(now))
      val query = WfQuery(dueTimes=Seq(wfQueryTime))
      val dueTimeFilter = FilterTest(c => due(c).exists(d => withinRange(todayRange,d)), dataInserted)

      query should selectSameResultsAs (dueTimeFilter)
    }

    "field is createdAt" in {
      val dataInserted = testData.map(createContent(_))
      val wfQueryTime = WfQueryTime(Some(oneDayAgo),Some(now))
      val query = WfQuery(creationTimes=Seq(wfQueryTime))
      val dueTimeFilter = FilterTest(c => withinRange(todayRange,createdAt(c)), dataInserted)

      query should selectSameResultsAs (dueTimeFilter)

    }
  }

  "Should return no results if date range is wrong way round" - {
    "field is due" in {
      val dataInserted = testData.map(createContent(_))

      val wfQueryTime = WfQueryTime(Some(now), Some(oneDayAgo))
      val query = WfQuery(dueTimes=Seq(wfQueryTime))

      query should selectSameResultsAs (FilterTest(noResults, dataInserted))
    }

    "field is createdAt" in {
      val dataInserted = testData.map(createContent(_))

      val wfQueryTime = WfQueryTime(Some(now),Some(oneDayAgo))
      val query = WfQuery(creationTimes=Seq(wfQueryTime))

      query should selectSameResultsAs (FilterTest(noResults, dataInserted))
    }
  }
}
