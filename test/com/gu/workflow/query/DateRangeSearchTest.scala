package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import models.ContentItem._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._



class DateRangeSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()

  lazy val now =  DateTime.now()
  lazy val oneDayAgo = DateTime.now().minusDays(1)
  lazy val twoDaysAgo = DateTime.now().minusDays(2)

  val todayRange = DateRange(oneDayAgo, now)
  val yesterdayRange = DateRange(twoDaysAgo, oneDayAgo)

  def dateRange(f: ContentItem => DateTime, dt: DateRange): FieldTest = c => (f(c) isAfter dt.from) && (f(c) isBefore dt.until)

  def dateRangeOpt(f: ContentItem => Option[DateTime], dt: DateRange): FieldTest = { c=>
    f(c) match {
      case Some(v) => (v isAfter dt.from) && (v isBefore dt.until)
      case None => false
    }
  }

  val dateFields: DateRange => FieldTest = { dt =>
    dateRange(stubLastMod, dt) |
      dateRange(createdAt, dt) |
      dateRangeOpt(due, dt) |
      dateRangeOpt(wcLastMod, dt) |
      dateRangeOpt(timePublished, dt) |
      dateRangeOpt(timeTakenDown, dt) |
      dateRangeOpt(embargoedUntil, dt) |
      dateRangeOpt(scheduledLaunchDate, dt)
  }

  "No date range set"  in {
    val dataInserted = createContent(testData)
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Date range set for today" in {
    val dataInserted = createContent(testData)
    val query = WfQuery(viewTimes = Some(todayRange))
    query should selectSameResultsAs (FilterTest(dateFields(todayRange), dataInserted))
  }

  "Date range set for yesterday"  in {
    val dataInserted = createContent(testData)
    val query = WfQuery(viewTimes = Some(yesterdayRange))
    query should selectSameResultsAs (FilterTest(dateFields(yesterdayRange), dataInserted))
  }


}
