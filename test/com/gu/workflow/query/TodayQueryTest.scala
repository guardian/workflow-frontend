package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import scala.util.Random._
import models.ContentItem._


class TodayQueryTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {
//todo - use seed for generating data
  def randomDate = DateTime.now().minusDays(scala.util.Random.nextInt(100))

  def todayInt = DateTime.now().minusHours(12)

  def yesInt = DateTime.now().minusHours(36)

  def generateTestData(n:Int=20, acc: List[ContentItem]=Nil): List[ContentItem] = {
      if(n==0) acc
      else {
        val ci = contentItem(defaultStub(
          lastModified = randomDate,
          createdAt = randomDate,
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
