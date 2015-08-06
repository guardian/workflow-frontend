package com.gu.workflow.query

import lib.PostgresDB
import org.joda.time.DateTime
import test._
import models._
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
import ContentItem._
import lib.TestData._

class StatusFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {


  val testData = generateTestData()

  "One parameter set for a status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val oneStatusFilter = FilterTest(subs, dataInserted)
    val query = WfQuery(status=Seq(Status("Subs")))

    query should selectSameResultsAs (oneStatusFilter)
  }

  "No parameter set for a status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery()

    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Multiple parameters set for status" in {
    val dataInserted = testData.map(createContent(_)).flatten

    val multiFilter = FilterTest((writers | desk), dataInserted)
    val query = WfQuery(status=Seq(Status("Writers"), Status("Desk")))

    query should selectSameResultsAs (multiFilter)
  }


  "All parameters set for status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(status=Seq(Status("Writers"), Status("Desk"), Status("Subs"), Status("Production Editor"), Status("Revise"), Status("Final"), Status("Hold")))

    val multiFilter = FilterTest(writers | desk | subs | prodEd | revise | `final` | hold, dataInserted)

    query should selectSameResultsAs (multiFilter)
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Bad parameter set for status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(status=Seq(Status("NotValid")))
    query should selectSameResultsAs (FilterTest(noResults, dataInserted))
  }


  "Tmp" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val query = WfQuery(status=Seq(Status("Writers")))

    val filter = Tmp[Option[Status]](c => c.wcOpt.map(_.status), a => a==Some(Status("Writers")), dataInserted)

    query should selectSameResultsAs (filter)


  }

}
