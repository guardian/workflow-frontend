package com.gu.workflow.admin

import com.gu.workflow.db.SectionDB
import com.gu.workflow.test.CommonDBIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import org.scalatest.{Matchers, FreeSpec}

class SectionDBTest extends FreeSpec with CommonDBIntegrationSuite  with Matchers {

  "Should retrieve sections" in withSectionsTestData(generateSections()) { dataInserted =>
    SectionDB.sectionList.map(_.name) should equal("Cities" :: "Technology" :: "Dev" :: dataInserted.map(_.name))
  }

  "Should insert a section with a unique name" in {
    val section = generateSection()
    SectionDB.upsert(section) should equal(1)
  }

  "Should do nothing if the upsert is called on a section with the same name" in {
    val section = generateSection()
    SectionDB.upsert(section) should equal(1)
    SectionDB.upsert(section) should equal(0)

  }

  "Should remove a section" in {
    val section = generateSection()
    val sectionFromDB = createSection(section)
    SectionDB.remove(section) should equal (1)
    SectionDB.getByName(sectionFromDB.name) should equal (None)
  }

}
