package com.gu.workflow.query

import models.{Stub, ContentItem, Flag}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import play.api.db.DB
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import lib._

class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val stubAndWorkflowContent = randomStubAndWC

  val stubOnly = randomStub

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
    "should be able to create and read stub" in {
      PostgresDB.createContent(stubOnly).fold(err =>
        fail(s"expected right got left $err"),
        up => {
          PostgresDB.getContentById(up.stubId) should equal(Some(contentItemWithId(stubOnly, up.stubId)))
          up.composerId should equal(None)
        }
      )
    }

    "the same stub data can be inserted and new ids will be created" in {
      PostgresDB.createContent(stubOnly)
      PostgresDB.createContent(stubOnly).fold(err =>
        fail(s"expected right got left $err"),
        up => {
          PostgresDB.getContentById(up.stubId) should equal(Some(contentItemWithId(stubOnly, up.stubId)))
          up.composerId should equal(None)
        }
      )
    }

    "should be able to create a stub and workflow content together" in {
      PostgresDB.createContent(stubAndWorkflowContent).fold(err =>
        fail(s"expected right got left $err"),
        up => {
          PostgresDB.getContentById(up.stubId) should equal(Some(contentItemWithId(stubAndWorkflowContent, up.stubId)))
          up.composerId should equal(stubAndWorkflowContent.wcOpt.map(_.composerId))
        }
      )
    }

    "inserting an item twice should result in a None the second time" in {
      PostgresDB.createContent(stubAndWorkflowContent)
      PostgresDB.createContent(stubAndWorkflowContent).fold(err =>
        err should equal(ContentItemExists),
        r => fail(s"expected left got right ${r}")
      )
    }

    "creating a content item with different composerIds should return a left ComposerIdsConflict" in {
      val toUpdate = randomStubAndWC
      val wcComposerId = toUpdate.wcOpt.map(_.composerId)
      val stubComposerId = Some("sdfhhsdkjfhs")
      val diffIds = ContentItem(toUpdate.stub.copy(composerId = stubComposerId), toUpdate.wcOpt)
      PostgresDB.createContent(diffIds) should equal(Left(ComposerIdsConflict(stubComposerId, wcComposerId)))
    }

    "creating a stub with composerId defined and no wc" in {
      val toUpdate = randomStub
      val stubComposerId = Some("sdfhhsdkjfhs")
      val stubWithComposerId = ContentItem(toUpdate.stub.copy(composerId = stubComposerId), None)
      PostgresDB.createContent(stubWithComposerId) should equal(Left(ComposerIdsConflict(stubComposerId, None)))
    }

    "creating a stub without composerId and wc is defined" in {
      val toUpdate = randomStubAndWC
      val wcComposerId = toUpdate.wcOpt.map(_.composerId)
      val noComposerId = ContentItem(toUpdate.stub.copy(composerId = None), toUpdate.wcOpt)
      PostgresDB.createContent(noComposerId) should equal(Left(ComposerIdsConflict(None, wcComposerId)))
    }
  }

  "updateContentItem" - {
    "should update specific fields of the stub" in withContentItem(stubOnly) { ci =>
      val updatedContentItem = randomContentItem(1.0)

      ci.stub.id.fold(fail("id should be inserted"))(stubId => {
        val updatedStub = updatedContentItem.stub
        PostgresDB.updateContentItem(stubId, updatedContentItem) should equal(Right(ContentUpdate(stubId, None)))

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
        PostgresDB.updateContentItem(stubId, updatedContentItem) should equal(Right(ContentUpdate(stubId, composerId)))
        val updatedStubDB = PostgresDB.getContentById(stubId)
        updatedStubDB.fold(fail("should retrieve content item"))({ ci =>
          ci.stub.title should equal(updatedContentItem.stub.title)
          ci.wcOpt should equal(updatedContentItem.wcOpt)
        })
      })
    }

    "should return left ContentItemExists if item with the same id attempts to be inserted twice" in withContentItem(stubOnly) { ci =>
      val contentItemToUpdate = randomStubAndWC
      val composerId = contentItemToUpdate.wcOpt.map(_.composerId)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.updateContentItem(stubId, contentItemToUpdate)
        PostgresDB.updateContentItem(stubId, contentItemToUpdate) should equal(Left(ContentItemExists))
      })
    }

    "should return left stub not found" in {
      val nonExistentId = 1000L
      PostgresDB.updateContentItem(nonExistentId, stubOnly) should equal(Left(StubNotFound(nonExistentId)))
    }

    "should return left stub not found and not insert a composer row" in {
      val nonExistentId = 1000L
      val cId = stubAndWorkflowContent.wcOpt.map(_.composerId)
      PostgresDB.updateContentItem(nonExistentId, stubAndWorkflowContent) should equal(Left(StubNotFound(nonExistentId)))
      cId.fold(fail("composerId should exist"))({ cId =>
        PostgresDB.getWorkflowItem(cId) should equal(None)
      })
    }

    "updating a content item with different composerIds should return a left ComposerIdsConflict" in withContentItem(stubOnly) { ci =>
      val toUpdate = randomStubAndWC
      val wcComposerId = toUpdate.wcOpt.map(_.composerId)
      val stubComposerId = Some("sdfhhsdkjfhs")
      val diffIds = ContentItem(toUpdate.stub.copy(composerId = stubComposerId), toUpdate.wcOpt)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.updateContentItem(stubId, diffIds) should equal(Left(ComposerIdsConflict(stubComposerId, wcComposerId)))
      })
    }

    "updating a stub with composerId defined and no wc" in withContentItem(stubOnly) { ci =>
      val toUpdate = randomStub
      val stubComposerId = Some("sdfhhsdkjfhs")
      val stubWithComposerId = ContentItem(toUpdate.stub.copy(composerId = stubComposerId), None)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.updateContentItem(stubId, stubWithComposerId) should equal(Left(ComposerIdsConflict(stubComposerId, None)))
      })
    }

    "updating a stub without composerId and wc is defined" in withContentItem(stubOnly) { ci =>
      val toUpdate = randomStubAndWC
      val wcComposerId = toUpdate.wcOpt.map(_.composerId)
      val noComposerId = ContentItem(toUpdate.stub.copy(composerId = None), toUpdate.wcOpt)
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.updateContentItem(stubId, noComposerId) should equal(Left(ComposerIdsConflict(None, wcComposerId)))
      })
    }
  }


  "deleteContent" - {
    "should return deleteOp with stubId and composerRow set to 1 if both rows exist" in withContentItem(stubAndWorkflowContent) { ci =>
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.deleteContentByStubId(stubId) should equal(Some(DeleteOp(stubId, 1)))
      })
    }

    "should return deleteOp with stubId and composerRow set to 0 if only stub exists" in withContentItem(stubOnly) { ci =>
      ci.stub.id.fold(fail("id should be inserted"))({ stubId =>
        PostgresDB.deleteContentByStubId(stubId) should equal(Some(DeleteOp(stubId, 0)))
      })
    }

    "Should return None if the stub row doesn't exist" in {
      val nonExistentId = 1000L
      PostgresDB.deleteContentByStubId(nonExistentId) should equal(None)
    }
  }
}
