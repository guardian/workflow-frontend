package com.gu.workflow.plan

import com.gu.workflow.db.{BundleDB, DayNoteDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import models.Bundle
import org.scalatest.{Matchers, FreeSpec}

class BundleDBTest extends FreeSpec with CommonDBIntegrationSuite with Matchers {

  val bundleInsertedBySchema = Bundle("No bundle", 0)

  "Should query on bundles" in withBundleTestData(generateBundles()) { dataInserted =>
    BundleDB.getBundles() should equal (Some((bundleInsertedBySchema :: dataInserted).sortBy(b => b.id)))
  }

  "Should retrieve a bundle inserted" - {
    "get bundle by id" in {
      val bundle = generateBundle()
      val bundleFromDB = createBundle(bundle)
      BundleDB.getBundleById(bundleFromDB.id) should equal (Some(bundleFromDB))
    }

    "should return none if not inserted" in {
      BundleDB.getBundleById(1000L) should equal (None)
    }
  }

  "Should delete a bundle" - {
    "delete bundle that exists" in {
      val bundle = generateBundle()
      val bundleFromDB = createBundle(bundle)
      BundleDB.deleteBundle(bundleFromDB) should equal (Some(bundleFromDB.id))
      BundleDB.getBundleById(bundleFromDB.id) should equal (None)

    }

    "return none if item doesn't exist" in {
      val dayNote = generateDayNote()
      DayNoteDB.deleteDayNote(dayNote) should equal (None)
    }
  }

  "Should update a field" - {
    "update a title" in {
      val bundle = generateBundle()
      val bundleFromDB = createBundle(bundle)
      BundleDB.update(bundleFromDB.id, "title", "asdfh")
      BundleDB.getBundleById(bundleFromDB.id).map(_.title) should equal (Some("asdfh"))
    }

    "update a day note that doesn't exist" in {
      val bundle = generateBundle()
      BundleDB.update(bundle.id, "title", "asdfh") should equal (None)
    }
  }


}
