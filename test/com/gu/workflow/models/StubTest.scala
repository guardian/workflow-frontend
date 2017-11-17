package com.gu.workflow.models

import com.gu.workflow.test.lib.TestData._
import io.circe.parser.decode
import io.circe.syntax._
import lib.ResourcesHelper
import models._
import org.scalatest.{FreeSpec, Matchers}

class StubTest extends FreeSpec with Matchers with ResourcesHelper{
  "StubReads" - {
    "should read the minimum required fields for a stub" in {
      val resource = slurp("stub-min-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      decode[Stub](resource).fold(_ => fail("should parse the stub fields"), stub => {
        stub.section should equal("section")
        stub.title should equal("title")
        stub.priority should equal(0)
        stub.needsLegal should equal (Flag.NA)
        stub.prodOffice should equal ("UK")
        stub.trashed should equal (false)
        stub.assignee should equal (None)
        stub.contentType should equal ("article")
      })
    }

    "should read the minimum required fields for a stub and set default fields" in {
      val resource = slurp("content-item-min-fields.json").getOrElse(
        throw new RuntimeException("could not find test resource"))

      decode[Stub](resource).fold(_ => fail("should parse the content field"), stub => {
        stub.composerId should equal (Some("56cc74bfa7c8a951d739c3f4"))
        stub.title should equal ("working")
        stub.prodOffice should equal ("UK")
        stub.section should equal ("100 Voices (Project)")
        stub.contentType should equal ("article")
        stub.composerId should equal (Some("56cc74bfa7c8a951d739c3f4"))
        stub.externalData.map(_.status) should equal (Some(Status.Writers))
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

      decode[Stub](resource).fold(_ => fail("should parse the content field"), stub => {
        stub.composerId should equal (Some("56cc7694a7c8a951d739c3f9"))
        stub.title should equal ("headline")
        stub.prodOffice should equal ("UK")
        stub.section should equal ("AU News")
        stub.contentType should equal ("article")
        stub.composerId should equal (Some("56cc7694a7c8a951d739c3f9"))
        stub.contentType should equal ("article")
        stub.externalData.map(_.status) should equal (Some(Status.Desk))
        stub.externalData.flatMap(_.activeInInCopy) should equal (Some(true))
        stub.externalData.flatMap(_.takenDown) should equal (Some(false))
        stub.externalData.flatMap(_.optimisedForWebChanged) should equal (Some(false))
        stub.externalData.flatMap(_.optimisedForWebChanged) should equal (Some(false))
        stub.externalData.flatMap(_.sensitive) should equal (Some(false))
        stub.externalData.flatMap(_.legallySensitive) should equal (Some(false))
      })
    }
  }

  "StubWrites" - {
    "should write a stub to json" in {
      val stub = randomStub
      val json = stub.asJson
      json.as[Stub].fold(e => fail(s"Should be valid stub json: $e"), stub => {
        stub should equal (stub)
      })
    }

    "should write a stub to flat json" in {
      val stub = randomStub
      val flatJson = stub.asJson(Stub.flatJsonEncoder)

      flatJson.as[Stub](Stub.flatJsonDecoder).fold(e => fail(s"Should be valid flat stub json: $e"), s => {
        val stubWithDateFields = s.copy(createdAt = stub.createdAt, lastModified = stub.lastModified)
        stubWithDateFields should equal (stub)
      })
    }
  }
}

