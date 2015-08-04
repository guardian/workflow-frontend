package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import scala.util.Random._


class TodayQueryTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  def randomDate = DateTime.now().minusDays(scala.util.Random.nextInt(100))

  def generateTestData(n:Int=20, acc: List[ContentItem]=Nil): List[ContentItem] = {
      if(n==0) acc
      else {
        val ci = contentItem(defaultStub(
          lastModified = randomDate,
          createdAt =randomDate,
          due = Some(randomDate)
        ), Some(defaultWorkflow(
          lastModified = randomDate,
          timePublished = Some(randomDate),
          timeTakenDown = Some(randomDate),
          embargoedUntil = Some(randomDate),
          scheduledLaunchDate = Some(randomDate)
        )))
        generateTestData(n-1, ci :: acc)
      }
  }

  val testData = generateTestData()

  val todayRange = DateRange(DateTime.now().minusDays(1), DateTime.now())

  val yesterdayRange = DateRange(DateTime.now().minusDays(2), DateTime.now().minusDays(1))

  "No date range set" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Date range set for today" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val query = WfQuery(viewTimes = Some(todayRange))
    //todo - figure out how to filter the scala model properly
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Date range set for yesterday" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(viewTimes = Some(yesterdayRange))
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }


}
