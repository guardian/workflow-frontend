package com.gu.workflow.query

import lib.PostgresDB
import org.joda.time.DateTime
import test._
import models._
import org.scalatest.{Matchers, FreeSpec}
import FilterTestOps._
import ContentItem._

class WfQueryTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {


  def generateStatus(statuses: List[Status]): List[ContentItem] = {
    statuses.map { st =>
      contentItem(defaultStub(), Some(defaultWorkflow(status = st)))
    }
  }

  //todo - smarter way to programmatically generate test data
  val testData = generateStatus(
    ("Writers" ::
      "Desk" ::
      "Production Editor" ::
      "Subs" ::
      "Revise" ::
      "Final" ::
      "Hold" ::
      Nil) map (Status(_)))

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

}
