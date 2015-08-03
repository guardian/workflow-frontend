package com.gu.workflow.query

import lib.PostgresDB
import org.joda.time.DateTime
import test._
import models.{Section, DashboardRow, ContentItem, Status}
import org.scalatest.{Matchers, FreeSpec}

class WfQueryTest extends FreeSpec with WorkflowIntegrationSuite  with Matchers{

  def generateStatus(statuses: List[Status]): List[ContentItem] = {
    statuses.map { st =>
      contentItem(defaultStub(), Some(defaultWorkflow(status = st)))
    }
  }

  val testData = generateStatus(
    ("Writers" ::
      "Desk" ::
      "Production Editor" ::
      "Subs" ::
      "Revise" ::
      "Final" ::
      "Hold" ::
      Nil) map (Status(_)))

  "test query on status"  - {

    //generate all status data.
    //persist



    "One parameter set for a status" in {
      val dataInserted = testData.map(createContent(_)).flatten

      val filteredDataInserted = dataInserted.filter(_.wcOpt.map(wc => wc.status) == Some(Status("Writers")))

      val wfQuery = WfQuery(status=Seq(Status("Writers")))
      val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
      val dataQueried = list.map(DashboardRow.toContentItem(_))
      filteredDataInserted should equal (dataQueried)
    }

  }

  "second test" - {

    "No parameter set for a status" in {
      val dataInserted = testData.map(createContent(_)).flatten
      println(s"DATA INSERTED ${dataInserted}")
      val wfQuery = WfQuery()
      val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
      val dataQueried = list.map(DashboardRow.toContentItem(_))
      println(s"DATA QUERIED ${dataQueried}")
      dataInserted should equal (dataQueried)
    }

  }


}
