package com.gu.workflow.query

import lib.PostgresDB
import org.joda.time.DateTime
import test._
import models._
import org.scalatest.{Matchers, FreeSpec}

class WfQueryTest extends FreeSpec with WorkflowIntegrationSuite with FilterTestOps with Matchers{

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

  "One parameter set for a status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val filteredDataInserted = dataInserted.filter(_.wcOpt.map(wc => wc.status) == Some(Status("Writers")))
    val wfQuery = WfQuery(status=Seq(Status("Writers")))
    val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
    val dataQueried = list.map(DashboardRow.toContentItem(_))
    filteredDataInserted should contain theSameElementsAs (dataQueried)
  }

  "No parameter set for a status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val wfQuery = WfQuery()
    val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
    val dataQueried = list.map(DashboardRow.toContentItem(_))
    dataInserted should contain theSameElementsAs (dataQueried)
  }

  "Multiple parameters set for status" in {
    val dataInserted = testData.map(createContent(_)).flatten
    val wfQuery = WfQuery(status = Seq(Status("Writers"), Status("Desk")))
    val filteredDataInserted = dataInserted.filter(d => d.wcOpt.map(wc => wc.status) == Some(Status("Writers")) || d.wcOpt.map(wc => wc.status) == Some(Status("Desk")))
    val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)

    val dataQueried = list.map(DashboardRow.toContentItem(_))

    filteredDataInserted should contain theSameElementsAs (dataQueried)

    // "One parameter set for a status" in {

    //   val dataInserted = testData.map(createContent(_)).flatten
    //   val oneStatusFilter = FilterTest { _.wcOpt.map(wc => wc.status) == Some(Status("Subs")) }
    //   val query = WfQuery(status=Seq(Status("Subs")))

    //   // TODO :- trying achieve something like this:
    //   //      query should returnSameResultsAs oneStatusFilter


    //   DBResult(query, dataInserted) should selectSameResultsAs(oneStatusFilter, dataInserted)

      // val dataInserted = testData.map(createContent(_)).flatten
      // val filteredDataInserted = dataInserted.filter(_.wcOpt.map(wc => wc.status) == Some(Status("Writers")))
      // val wfQuery =
      // val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
      // val dataQueried = list.map(DashboardRow.toContentItem(_))
      // filteredDataInserted should contain theSameElementsAs (dataQueried)
    }

  // "second test" - {
  //   "No parameter set for a status" in {
  //     val dataInserted = testData.map(createContent(_)).flatten
  //     val wfQuery = WfQuery()

}
