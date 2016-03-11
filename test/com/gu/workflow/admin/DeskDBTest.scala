package com.gu.workflow.admin

import com.gu.workflow.db.{CommonDB, DeskDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import models.WorkflowContent
import org.scalatest.{Matchers, FreeSpec}
import com.gu.workflow.test.lib.TestData._

class DeskDBTest extends FreeSpec with CommonDBIntegrationSuite with Matchers {

  "deskList should retrieve desks" in withDesksTestData(generateDesks()) { dataInserted =>
    DeskDB.deskList should equal(dataInserted)
  }

  "upsert should insert a desk if not already present in the table" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    val deskFromDB = DeskDB.getByName(desk.name)
    deskFromDB.isDefined should equal (true)
  }

  "upsert should return 0 if the desk is already present in table" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    DeskDB.upsert(desk) should equal(0)
  }

  "remove should delete a desk from a table" in {
    val desk = generateDesk()
    val deskFromDB = createDesk(desk)
    DeskDB.remove(desk) should equal (1)
    DeskDB.getByName(deskFromDB.name) should equal(None)
  }

}
