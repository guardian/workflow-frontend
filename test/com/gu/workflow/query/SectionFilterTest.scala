package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import lib.TestData._
import models.Status
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite

class SectionFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers{
  val testData = generateTestData()

  "No parameter set for a section" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery()

    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }


  "One parameter set for section" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val multiFilter = FilterTest((writers | desk), dataInserted)
    val query = WfQuery(status=Seq(Status("Writers"), Status("Desk")))

    query should selectSameResultsAs (multiFilter)
  }


  "Multiple paramets set for section" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(status=Seq(Status("Writers"), Status("Desk"), Status("Subs"), Status("Production Editor"), Status("Revise"), Status("Final"), Status("Hold")))

    val multiFilter = FilterTest(writers | desk | subs | prodEd | revise | `final` | hold, dataInserted)

    query should selectSameResultsAs (multiFilter)
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }
}
