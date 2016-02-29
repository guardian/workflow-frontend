package com.gu.workflow.models

import lib.ResourcesHelper
import models._
import org.scalatest.{Matchers, FreeSpec}
import play.api.libs.json.{Json, JsSuccess}
import com.gu.workflow.test.lib.TestData._

class ContentItemTest extends FreeSpec with Matchers with ResourcesHelper{
  "ContentReads" - {
    "should read the minimum required fields for a stub only" in {
      val resource = slurp("stub-min-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      val jsonRes = Json.parse(resource).validate[Stub]
      jsonRes.fold(_ => fail("should parse the stub fields"), stub => {
        stub.section should equal("section")
        stub.title should equal("title")
        stub.priority should equal(0)
        stub.needsLegal should equal (Flag.NotRequired)
        stub.prodOffice should equal ("UK")
        stub.trashed should equal (false)
        stub.assignee should equal (None)
        stub.contentType should equal ("article")
      })
    }

    "should read the minimum required fields for a content item and set default fields" in {
      val resource = slurp("content-item-min-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      val jsonRes = Json.parse(resource).validate[ContentItem]

      jsonRes.fold(_ => fail("should parse the content field"), ci => {
        ci.stub.composerId should equal (Some("56cc74bfa7c8a951d739c3f4"))
        ci.stub.title should equal ("working")
        ci.stub.prodOffice should equal ("UK")
        ci.stub.section should equal ("100 Voices (Project)")
        ci.stub.contentType should equal ("article")
        ci.wcOpt.map(_.composerId) should equal (Some("56cc74bfa7c8a951d739c3f4"))
        ci.wcOpt.map(_.status) should equal (Some(Status("Writers")))
        ci.wcOpt.map(_.activeInInCopy) should equal (Some(false))
        ci.wcOpt.map(_.takenDown) should equal (Some(false))
        ci.wcOpt.map(_.published) should equal (Some(false))
        ci.wcOpt.map(_.statusFlags) should equal (Some(WorkflowContentStatusFlags(commentable = false, optimisedForWeb = false, optimisedForWebChanged = false)))
        ci.wcOpt.map(_.launchScheduleDetails) should equal (Some(LaunchScheduleDetails(None, None, false)))
        ci.wcOpt.map(_.wordCount) should equal (Some(0))
      })
    }

    "should read maximum set fields which can be defined on a creation" in {
      val resource = slurp("content-item-max-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      val jsonRes = Json.parse(resource).validate[ContentItem]

      jsonRes.fold(_ => fail("should parse the content field"), ci => {
        ci.stub.composerId should equal (Some("56cc7694a7c8a951d739c3f9"))
        ci.stub.title should equal ("headline")
        ci.stub.prodOffice should equal ("UK")
        ci.stub.section should equal ("AU News")
        ci.stub.contentType should equal ("article")

        ci.wcOpt.map(_.composerId) should equal (Some("56cc7694a7c8a951d739c3f9"))
        ci.wcOpt.map(_.status) should equal (Some(Status("Desk")))
        ci.wcOpt.map(_.activeInInCopy) should equal (Some(true))
        ci.wcOpt.map(_.takenDown) should equal (Some(false))
        ci.wcOpt.flatMap(_.headline) should equal (Some("headline"))
        ci.wcOpt.flatMap(_.lastModifiedBy) should equal (Some("test-bunny"))
        ci.wcOpt.map(_.statusFlags) should equal (Some(WorkflowContentStatusFlags(commentable = true, optimisedForWeb = false, optimisedForWebChanged = false)))
      })
    }
  }

  "ContentWrites" - {
    "should write a stub to json" in {
      val ci = randomStub
      val jsValue = Json.toJson(ci)
      jsValue.validate[Stub].fold(_ => fail("should be validate stub json"), stub => {
        stub should equal (ci.stub)
      })
    }

    "should write a content item to json" in {
      val ci = randomStubAndWC
      val jsValue = Json.toJson(ci)
      jsValue.validate[ContentItem].fold(_ => fail("should be validate content item json"), contentItem => {
        val stubWithDateFields = contentItem.stub.copy(createdAt = ci.stub.createdAt, lastModified = ci.stub.lastModified)
        stubWithDateFields should equal (ci.stub)
        contentItem.wcOpt should equal (ci.wcOpt)
        contentItem.wcOpt.isDefined should equal (true)
      })
    }
  }

}

