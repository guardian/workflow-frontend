package com.gu.workflow.query

import models.{ContentItem, Flag}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib.PostgresDB

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers{

  val stubAndWorkflowContent = randomContentItem(0.0)

  val stubOnly = randomContentItem(1.0)

  "updateStubTrashed" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubTrashed(id, Some(true)) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.trashed should equal (true)
      })
    })
  }

  "updateStubWorkingTitle" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWorkingTitle(id, "an updated working title") should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.title should equal ("an updated working title")
      })
    })
  }

  "updatePriority" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubPriority(id, 2) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.priority should equal (2)
      })
    })
  }

  "updateStubWithAssignee" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWithAssignee(id, Some("assignee")) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assignee should equal (Some("assignee"))
      })
    })
  }

  "updateStubWithAssigneeEmail" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubWithAssigneeEmail(id, Some("assignee-email")) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assigneeEmail should equal (Some("assignee-email"))
      })
    })
  }

  "putStubDueDate" in withContentItem(stubAndWorkflowContent) { ci =>
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
    "field can be unset" in withContentItem(stubAndWorkflowContent) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id =>{
        PostgresDB.updateStubNote(id, "") should equal (1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal (None)
        })
      })
    }

    "field can be set" in withContentItem(stubAndWorkflowContent) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id =>{
        PostgresDB.updateStubNote(id, "a note") should equal (1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal (Some("a note"))
        })
      })
    }
  }

  "updateStubSection" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubSection(id, "section") should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.section should equal ("section")
      })
    })
  }

  "updateStubLegalStatus" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id =>{
      PostgresDB.updateStubLegalStatus(id, Flag.Required) should equal (1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.needsLegal should equal (Flag.Required)
      })
    })
  }

  "updateContentStatus" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.composerId.fold(fail("should have an id defined"))(cId => {
      PostgresDB.updateContentStatus("New Status", cId) should equal (1)
      val updatedContent = PostgresDB.getContentByCompserId(cId)
      updatedContent.flatMap(_.wcOpt.map(_.status)).fold(fail("should be able to retrieve by id"))(s => {
        s.name should equal ("New Status")
      })
    })
  }

  "createContent" - {
    "should be able to create a stub" in {
      val idOpt = PostgresDB.createContent(stubOnly)
      idOpt.fold(fail("id should be inserted into the data store"))(stubId => {
        PostgresDB.getContentById(stubId) should equal (Some((ContentItem(stubOnly.stub.copy(id = Some(stubId)), None))))
      })
    }

    "the same stub data can be inserted and new ids will be created" in {
      val idOpt = PostgresDB.createContent(stubOnly)
      idOpt.fold(fail("id should be inserted into the data store"))(stubId => {
        PostgresDB.getContentById(stubId) should equal (Some((ContentItem(stubOnly.stub.copy(id = Some(stubId)), None))))
      })
    }

    "should be able to create a stub and workflow content together" in {
      val idOpt = PostgresDB.createContent(stubAndWorkflowContent)
      idOpt.fold(fail("id should be inserted into the data store"))(stubId => {
        PostgresDB.getContentById(stubId) should equal (Some((ContentItem(stubAndWorkflowContent.stub.copy(id = Some(stubId)), stubAndWorkflowContent.wcOpt))))
        stubAndWorkflowContent.wcOpt.map(_.composerId).fold(fail("composerId should be defined"))(cId =>{
          PostgresDB.existingItem(cId) should equal (Some(stubId))
        })
      })
    }

    "inserting an item twice should result in a None the second time" in {
      val firstOperation = PostgresDB.createContent(stubAndWorkflowContent)
      val secondOperation = PostgresDB.createContent(stubAndWorkflowContent)
      secondOperation should equal (None)
    }
  }
}
