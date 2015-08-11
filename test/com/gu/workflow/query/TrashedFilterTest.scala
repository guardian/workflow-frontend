package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import com.gu.workflow.test.lib.TestData._
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite

class TrashedFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()

  "No parameter set for a trashed" in withTestData(testData) {  dataInserted =>
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Parameter set to true trashed" in withTestData(testData) {  dataInserted =>
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted, isVisible))
  }

}
