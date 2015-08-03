package com.gu.workflow.query

import lib.PostgresDB
import org.joda.time.DateTime
import test._
import models.{Section, DashboardRow, ContentItem, Status}
import org.scalatest.{Matchers, FreeSpec}

class WfQueryTest extends FreeSpec with WorkflowIntegrationSuite  with Matchers{
  "test query on status"  - {

    //generate all status data.
    //persist

    def generateStatus(statuses: List[Status]): List[ContentItem] = {
      statuses.map { st =>
        contentItem(defaultStub(), Some(defaultWorkflow(status = st)))
      }
    }

    val testData = generateStatus(
      ("Writers" ::
//         "Desk" ::
//         "Production Editor" ::
//         "Subs" ::
//         "Revise" ::
//         "Final" ::
//         "Hold" ::
         Nil) map (Status(_)))

    "One parameter set for a status" in {
     val dataInserted = testData.map(createContent(_)).flatten
      val wfQuery = WfQuery(status=Seq(Status("Writers")))
      val list: List[DashboardRow] = PostgresDB.getContent(wfQuery)
      val dataQueried = list.map(DashboardRow.toContentItem(_))

        dataInserted should equal (dataQueried)

      dataInserted.head.stub should equal (dataQueried.head.stub)
      dataInserted.head.wcOpt.get.activeInInCopy should equal (dataQueried.head.wcOpt.get.activeInInCopy)
      dataInserted.head.wcOpt.get.composerId should equal (dataQueried.head.wcOpt.get.composerId)
      dataInserted.head.wcOpt.get.contentType should equal (dataQueried.head.wcOpt.get.contentType)
      dataInserted.head.wcOpt.get.headline should equal (dataQueried.head.wcOpt.get.headline)
      dataInserted.head.wcOpt.get.standfirst should equal (dataQueried.head.wcOpt.get.standfirst)
      dataInserted.head.wcOpt.get.trailtext should equal (dataQueried.head.wcOpt.get.trailtext)
      dataInserted.head.wcOpt.get.mainMedia should equal (dataQueried.head.wcOpt.get.mainMedia)
      dataInserted.head.wcOpt.get.trailImageUrl should equal (dataQueried.head.wcOpt.get.trailImageUrl)
      dataInserted.head.wcOpt.get.section should equal (dataQueried.head.wcOpt.get.section)
      dataInserted.head.wcOpt.get.lastModified should equal (dataQueried.head.wcOpt.get.lastModified)
      dataInserted.head.wcOpt.get.lastModifiedBy should equal (dataQueried.head.wcOpt.get.lastModifiedBy)
      dataInserted.head.wcOpt.get.published should equal (dataQueried.head.wcOpt.get.published)
      dataInserted.head.wcOpt.get.timePublished should equal (dataQueried.head.wcOpt.get.timePublished)
      dataInserted.head.wcOpt.get.storyBundleId should equal (dataQueried.head.wcOpt.get.storyBundleId)
      dataInserted.head.wcOpt.get.takenDown should equal (dataQueried.head.wcOpt.get.takenDown)
      dataInserted.head.wcOpt.get.timeTakenDown should equal (dataQueried.head.wcOpt.get.timeTakenDown)
      dataInserted.head.wcOpt.get.wordCount should equal (dataQueried.head.wcOpt.get.wordCount)
      dataInserted.head.wcOpt.get.launchScheduleDetails should equal (dataQueried.head.wcOpt.get.launchScheduleDetails)
      dataInserted.head.wcOpt.get.statusFlags should equal (dataQueried.head.wcOpt.get.statusFlags)
    }

  }


}
