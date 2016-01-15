package com.gu.workflow.plan

import com.gu.workflow.db.{BundleDB, DayNoteDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import models.Bundle
import org.scalatest.{Matchers, FreeSpec}

class BundleDBTest extends FreeSpec with CommonDBIntegrationSuite  with Matchers {

  "Should retrieve a day bundle inserted" - {
    "get bundle by id" in {
      val bundle = generateBundle()
      val bundleFromDB = createBundle(bundle)
      BundleDB.getBundleById(bundleFromDB.id) should equal (Some(bundleFromDB))
    }
  }

}
