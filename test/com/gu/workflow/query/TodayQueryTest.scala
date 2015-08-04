package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite


class TodayQueryTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  def generateTestData(n:Int=10, acc: List[ContentItem]=Nil): List[ContentItem] = {
      if(n==0) acc
      else {
        val ci = contentItem(defaultStub(), Some(defaultWorkflow()))
        generateTestData(n-1, ci :: acc)
      }
  }

  val testData = generateTestData()

  "No date range set" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

}
