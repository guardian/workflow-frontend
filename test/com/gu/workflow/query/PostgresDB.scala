package com.gu.workflow.query

import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib.PostgresDB

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers{

  val contentItem = randomContentItem()

  "updateStubTrashed" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubTrashed(id, Some(true)) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.trashed should equal (true)
      })
    })
  }

  "updateStubWorkingTitle" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWorkingTitle(id, "an updated working title") should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.title should equal ("an updated working title")
      })
    })
  }

  "updatePriority" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubPriority(id, 2) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.priority should equal (2)
      })
    })
  }

  "updateStubWithAssignee" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWithAssignee(id, Some("assignee")) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assignee should equal (Some("assignee"))
      })
    })

  }

}
