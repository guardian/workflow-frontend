package com.gu.workflow.query

import models.{Stub, ContentItem, Flag}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import play.api.db.DB
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib._

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val stubAndWorkflowContent = randomContentItem(0.0)

  val stubOnly = randomContentItem(1.0)

  def contentItemWithId(c: ContentItem, stubId: Long) = {
    ContentItem(c.stub.copy(id = Some(stubId)), c.wcOpt)
  }

  "updateStubTrashed" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubTrashed(id, Some(true)) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.trashed should equal(true)
      })
    })
  }

  "updateStubWorkingTitle" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWorkingTitle(id, "an updated working title") should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.title should equal("an updated working title")
      })
    })
  }

  "updatePriority" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubPriority(id, 2) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.priority should equal(2)
      })
    })
  }

  "updateStubWithAssignee" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWithAssignee(id, Some("assignee")) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assignee should equal(Some("assignee"))
      })
    })
  }

  "updateStubWithAssigneeEmail" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubWithAssigneeEmail(id, Some("assignee-email")) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.assigneeEmail should equal(Some("assignee-email"))
      })
    })
  }

  "putStubDueDate" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      val now = DateTime.now()
      PostgresDB.updateStubDueDate(id, Some(now)) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.due should equal(Some(now))
      })
    })
  }

  "updateStubNote" - {
    "field can be unset" in withContentItem(stubAndWorkflowContent) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id => {
        PostgresDB.updateStubNote(id, "") should equal(1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal(None)
        })
      })
    }

    "field can be set" in withContentItem(stubAndWorkflowContent) { ci =>
      ci.stub.id.fold(fail("should have an id defined"))(id => {
        PostgresDB.updateStubNote(id, "a note") should equal(1)
        val updatedStub = PostgresDB.getContentById(id)
        updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
          s.note should equal(Some("a note"))
        })
      })
    }
  }

  "updateStubSection" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubSection(id, "section") should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.section should equal("section")
      })
    })
  }

  "updateStubLegalStatus" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("should have an id defined"))(id => {
      PostgresDB.updateStubLegalStatus(id, Flag.Required) should equal(1)
      val updatedStub = PostgresDB.getContentById(id)
      updatedStub.map(_.stub).fold(fail("should be able to retrieve by id"))(s => {
        s.needsLegal should equal(Flag.Required)
      })
    })
  }

  "updateContentStatus" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.composerId.fold(fail("should have an id defined"))(cId => {
      PostgresDB.updateContentStatus("New Status", cId) should equal(1)
      val updatedContent = PostgresDB.getContentByCompserId(cId)
      updatedContent.flatMap(_.wcOpt.map(_.status)).fold(fail("should be able to retrieve by id"))(s => {
        s.name should equal("New Status")
      })
    })
  }

  "createContent" - {
    "should be able to create a stub" in {
      val updateOpt = PostgresDB.createContent(stubOnly)
      updateOpt.fold(fail("id should be inserted into the data store"))(update => {
        PostgresDB.getContentById(update.stubId) should equal(Some(contentItemWithId(stubOnly, update.stubId)))
      })
      updateOpt.flatMap(_.composerId) should equal (None)
    }

    "the same stub data can be inserted and new ids will be created" in {
      val updateOpt = PostgresDB.createContent(stubOnly)
      updateOpt.fold(fail("id should be inserted into the data store"))(update => {
        PostgresDB.getContentById(update.stubId) should equal(Some(contentItemWithId(stubOnly, update.stubId)))
      })
    }

    "should be able to create a stub and workflow content together" in {
      val updateOpt = PostgresDB.createContent(stubAndWorkflowContent)
      updateOpt.fold(fail("id should be inserted into the data store"))(update => {
        PostgresDB.getContentById(update.stubId) should equal(Some(contentItemWithId(stubAndWorkflowContent, update.stubId)))
      })
      updateOpt.flatMap(_.composerId) should equal (stubAndWorkflowContent.wcOpt.map(_.composerId))
    }

    "inserting an item twice should result in a None the second time" in {
      PostgresDB.createContent(stubAndWorkflowContent)
      val secondOperation = PostgresDB.createContent(stubAndWorkflowContent)
      secondOperation should equal(None)
    }
  }

  "updateContentItem" - {
    "should update specific fields of the stub" in withContentItem(stubOnly) { ci =>
      val updatedContentItem = randomContentItem(1.0)

      ci.stub.id.fold(fail("id should be inserted"))(stubId => {
        val updatedStub = updatedContentItem.stub
        PostgresDB.updateContentItem(stubId, updatedContentItem) should equal (Some(ContentUpdate(stubId, None, 1)))

        val updatedStubDB = PostgresDB.getContentById(stubId)

        updatedStubDB.fold(fail("should retrieve content item"))({ ci =>
          ci.stub.title should equal(updatedStub.title)
          ci.stub.section should equal(updatedStub.section)
          ci.stub.due should equal(updatedStub.due)
          ci.stub.assignee should equal(updatedStub.assignee)
          ci.stub.assigneeEmail should equal(updatedStub.assigneeEmail)
          ci.stub.composerId should equal(updatedStub.composerId)
          ci.stub.contentType should equal(updatedStub.contentType)
          ci.stub.priority should equal(updatedStub.priority)
          ci.stub.prodOffice should equal(updatedStub.prodOffice)
          ci.stub.needsLegal should equal(updatedStub.needsLegal)
          ci.stub.note should equal(updatedStub.note)
        })

      })
    }

    "should update stub and insert content item" in withContentItem(stubOnly) { ci =>
      val updatedContentItem = randomContentItem(0.0)
      val composerId = updatedContentItem.wcOpt.map(_.composerId)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.updateContentItem(stubId, updatedContentItem) should equal(Some(ContentUpdate(stubId,composerId, 1)))
        val updatedStubDB = PostgresDB.getContentById(stubId)
        updatedStubDB.fold(fail("should retrieve content item"))({ ci =>
          ci.stub.title should equal (updatedContentItem.stub.title)
          ci.wcOpt should equal (updatedContentItem.wcOpt)
        })
      })
    }

    "should return none if item with the same id attempts to be inserted twice" in withContentItem(stubOnly) { ci =>
      val updatedContentItem = randomContentItem(0.0)
      val composerId = updatedContentItem.wcOpt.map(_.composerId)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
          PostgresDB.updateContentItem(stubId, updatedContentItem) should equal (Some(ContentUpdate(stubId,composerId, 1)))
          PostgresDB.updateContentItem(stubId, updatedContentItem) should equal (None)
      })
    }

    "should return a rows field of 0 if id doesnt exist" in {
      val nonExistentId = 1000L
      PostgresDB.updateContentItem(nonExistentId, stubOnly) should equal (Some(ContentUpdate(nonExistentId, None, 0)))
    }

    "should not insert content row if stub doesn't exist" in {
      val nonExistentId = 1000L
      val cId = stubAndWorkflowContent.wcOpt.map(_.composerId)
      PostgresDB.updateContentItem(nonExistentId, stubAndWorkflowContent) should equal (Some(ContentUpdate(nonExistentId, None, 0)))
      cId.fold(fail("composerId should exist"))({ cId =>
        PostgresDB.getWorkflowItem(cId) should equal (None)
      })
    }

    
  }


  "deleteContent should remove from stub and content table" in withContentItem(stubAndWorkflowContent) { ci =>
    ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
      PostgresDB.deleteStub(stubId)

      PostgresDB.getContentById(stubId) should equal (None)
      ci.wcOpt.map(_.composerId).fold(())({ cId =>
        PostgresDB.getWorkflowItem(cId) should equal (None)
      })

    })

  }


}
