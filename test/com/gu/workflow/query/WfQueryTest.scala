package com.gu.workflow.query

import test._
import models.ContentItem
import models.Status
import org.scalatest.{Matchers, FreeSpec}

class WfQueryTest extends FreeSpec with Matchers with WorkflowHelpers {
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
         "Desk" ::
         "Production Editor" ::
         "Subs" ::
         "Revise" ::
         "Final" ::
         "Hold" ::
         Nil) map (Status(_)))

    testData.foreach(createContent(_))

    println(testData)

    "I can run a test" in {
      val wfQuery = WfQuery(status=Nil)
      //all results

      val wfQueryOne = WfQuery(status=Seq(Status("Writers")))
      //should get only writers back

      val wfQueryTwo = WfQuery(status=Seq(Status("Writers"),Status("Desk")))

      assert(1 == 1)
    }

  }


}
