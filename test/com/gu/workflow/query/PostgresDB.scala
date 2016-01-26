package com.gu.workflow.query

import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib.PostgresDB

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers{

  val contentItem = randomContentItem()

  "be able to set trashed to true" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubDB(id, Some(true)) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.trashed should equal (true)
      })
    })
  }

  "be able to update working title" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateWorkingTitleDB(id, "an updated working title") should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.title should equal ("an updated working title")
      })
    })
  }

  "be able to update priority" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubPriorityDB(id, 2) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.priority should equal (2)
      })
    })

  }

}
