package com.gu.workflow.admin

import com.gu.workflow.db.DeskDB
import com.gu.workflow.test.CommonDBIntegrationSuite
import org.scalatest.{Matchers, FreeSpec, FunSuite}
import com.gu.workflow.test.lib.TestData._

class DeskDBTest extends  FreeSpec with CommonDBIntegrationSuite with Matchers {

  "Should retrieve desks" in withDesksTestData(generateDesks()) { dataInserted =>
    DeskDB.deskList should equal(dataInserted)
  }

  "Should insert a desk with a unique name and take no action if desk already exists" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    val deskFromDB = DeskDB.getByName(desk.name)
    deskFromDB.isDefined should equal (true)
  }

  "Should do nothing if the upsert is called on a desk with the same name" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    DeskDB.upsert(desk) should equal(0)

  }

  "Should remove a desk" in {
    val desk = generateDesk()
    val deskFromDB = createDesk(desk)
    DeskDB.remove(desk) should equal (1)
    DeskDB.getById(deskFromDB.id) should equal(None)
  }

}
