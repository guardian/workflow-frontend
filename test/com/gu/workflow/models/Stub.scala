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

      val jsonRes = Json.parse(resource).validate[Stub]

      jsonRes.fold(_ => fail("should parse the content field"), stub => {
        stub.composerId should equal (Some("56cc74bfa7c8a951d739c3f4"))
        stub.title should equal ("working")
        stub.prodOffice should equal ("UK")
        stub.section should equal ("100 Voices (Project)")
        stub.contentType should equal ("article")
        stub.composerId should equal (Some("56cc74bfa7c8a951d739c3f4"))
        stub.externalData.flatMap(_.status) should equal (Some(Status("Writers")))
        stub.externalData.flatMap(_.activeInInCopy) should equal (Some(false))
        stub.externalData.flatMap(_.takenDown) should equal (Some(false))
        stub.externalData.flatMap(_.published) should equal (Some(false))
        stub.externalData.flatMap(_.optimisedForWebChanged) should equal (Some(false))
        stub.externalData.flatMap(_.sensitive) should equal (Some(false))
        stub.externalData.flatMap(_.legallySensitive) should equal (Some(false))

        stub.externalData.flatMap(_.scheduledLaunchDate) should equal (None)
        stub.externalData.flatMap(_.embargoedUntil) should equal (None)
        stub.externalData.flatMap(_.embargoedIndefinitely) should equal (Some(false))
        stub.externalData.flatMap(_.wordCount) should equal (Some(0))
      })
    }

    "should read maximum set fields which can be defined on a creation" in {
      val resource = slurp("content-item-max-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      val jsonRes = Json.parse(resource).validate[Stub]

      jsonRes.fold(_ => fail("should parse the content field"), stub => {
        stub.composerId should equal (Some("56cc7694a7c8a951d739c3f9"))
        stub.title should equal ("headline")
        stub.prodOffice should equal ("UK")
        stub.section should equal ("AU News")
        stub.contentType should equal ("article")

        stub.composerId should equal (Some("56cc7694a7c8a951d739c3f9"))
        stub.contentType should equal ("article")
        stub.externalData.flatMap(_.status) should equal (Some(Status("Desk")))
        stub.externalData.flatMap(_.activeInInCopy) should equal (Some(true))
        stub.externalData.flatMap(_.takenDown) should equal (Some(false))
        stub.externalData.flatMap(_.optimisedForWebChanged) should equal (Some(false))
        stub.externalData.flatMap(_.optimisedForWebChanged) should equal (Some(false))
        stub.externalData.flatMap(_.sensitive) should equal (Some(false))
        stub.externalData.flatMap(_.legallySensitive) should equal (Some(false))
      })
    }
  }

  "ContentWrites" - {
    "should write a stub to json" in {
      val stub = randomStub
      val jsValue = Json.toJson(stub)(Stub.stubWrites)
      jsValue.validate[Stub].fold(_ => fail("should be validate stub json"), stub => {
        stub should equal (stub)
      })
    }

    "should write a content item to json" in {
      val stub = randomStub
      val jsValue = Json.toJson(stub)(Stub.flatStubWrites)
      jsValue.validate[Stub](Stub.flatJsonReads).fold(e => fail("should be valid stub json" + e.toString), vStub => {
        val stubWithDateFields = vStub.copy(createdAt = stub.createdAt, lastModified = stub.lastModified)
        stubWithDateFields should equal (stub)
      })
    }
  }

}

