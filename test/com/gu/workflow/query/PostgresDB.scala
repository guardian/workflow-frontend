package com.gu.workflow.query

import models.Flag
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib.PostgresDB

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers{

  val contentItem = randomContentItem(0.0)

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

  "updateStubWithAssigneeEmail" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubWithAssigneeEmail(id, Some("assignee-email")) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assigneeEmail should equal (Some("assignee-email"))
      })
    })
  }

  "putStubDueDate" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      val now = DateTime.now()
      PostgresDB.updateStubDueDate(id, Some(now)) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.due should equal (Some(now))
      })
    })
  }

  "updateStubNote"  - {
    "field can be unset" in withContentItem(contentItem) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id =>{
        PostgresDB.updateStubNote(id, "") should equal (1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal (None)
        })
      })
    }

    "field can be set" in withContentItem(contentItem) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id =>{
        PostgresDB.updateStubNote(id, "a note") should equal (1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal (Some("a note"))
        })
      })
    }
  }

  "updateStubSection" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubSection(id, "section") should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.section should equal ("section")
      })
    })
  }

  "updateStubLegalStatus" in withContentItem(contentItem) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubLegalStatus(id, Flag.Required) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.needsLegal should equal (Flag.Required)
      })
    })
  }

  "updateContentStatus" in withContentItem(contentItem) { ci =>
    ci.stub.composerId.fold(fail("should have an id defined"))(cId => {
      PostgresDB.updateContentStatus("New Status", cId) should equal (1)
      val updatedContent = PostgresDB.getContentByCompserId(cId)
      updatedContent.flatMap(_.wcOpt.map(_.status)).fold(fail("should be able to retrieve by id"))(s => {
        s.name should equal ("New Status")
      })
    })
  }

}
