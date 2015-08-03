package com.gu.workflow.query

import models.Status
import org.scalatest.{Matchers, FreeSpec}

class WfQueryTest extends FreeSpec with Matchers {
  "test query on status"  - {
    //generate all status data.
    //persist

    "I can run a test" in {
      val wfQuery = WfQuery(status=Nil)
      //all results

      val wfQueryOne = WfQuery(status=Seq(Status("Writers")))
      //should get only writers back

      val wfQueryTwo = WfQuery(status=Seq(Status("Writers"),Status("Desk")))
    }

  }


}
