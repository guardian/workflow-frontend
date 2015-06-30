package lib

import com.gu.workflow.query.{DraftState, WfQueryTime, WfQuery}
import models.{Flag, Status, Section}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec, FunSuite}
import play.api.test.FakeRequest

import scala.collection.mutable
import RequestParameters._

import scala.collection.mutable.ArrayBuffer


class RequestParametersTest extends FreeSpec with  Matchers {

  val fullQueryString = Map("assigneeEmail" -> ArrayBuffer("lindsey.dew@guardian.co.uk"),
                            "content-type" -> ArrayBuffer("article,liveblog"),
                            "created.from" -> ArrayBuffer("2015-06-28T23:00:00.000Z"),
                            "created.until" -> ArrayBuffer("2015-06-29T23:00:00.000Z"),
                            "due.from" -> ArrayBuffer("2015-07-03T23:00:00.000Z"),
                            "due.until" -> ArrayBuffer("2015-07-05T23:00:00.000Z"),
                            "flags" -> ArrayBuffer("needsLegal,approved"),
                            "incopy" -> ArrayBuffer("true"),
                            "section" -> ArrayBuffer("Developer+Blog,Arts"),
                            "state" -> ArrayBuffer("draft"),
                            "status" -> ArrayBuffer("Writers,Desk"),
                            "touched" -> ArrayBuffer("lindsey.dew@guardian.co.uk"),
                            "view.from" -> ArrayBuffer("2015-06-29T23:00:00.000Z"),
                            "view.until" -> ArrayBuffer("2015-06-30T23:00:00.000Z")
                            )

  "getQueryString" - {
    "should return query string map" in {
      getQueryString(FakeRequest("GET", "/api/content?state=draft")) should equal (Map("state"->ArrayBuffer("draft")))
      getQueryString(FakeRequest("GET", "/api/content?content-type=article,liveblog")) should equal (Map("content-type"->ArrayBuffer("article,liveblog")))
      getQueryString(FakeRequest("GET", "/api/content?state=draft&content-type=article,liveblog")) should equal (Map("state"->ArrayBuffer("draft"), "content-type"->ArrayBuffer("article,liveblog")))
    }
  }

  "getOptionFromQS" - {
    "should return element if present" in {
      getOptionFromQS("state", fullQueryString) should equal (Some("draft"))
    }

    "should return none if key is not preset in qs" in {
      getOptionFromQS("notakey", fullQueryString) should equal (None)
    }
    "should return none if element is an empty list" in {
      getOptionFromQS("notarealvalue", fullQueryString) should equal (None)
    }
  }

  "getOptionFromQS" - {
    "should return list element if present" in {
      getSeqFromQS("state", fullQueryString) should equal (Seq("draft"))
    }

    "should return empty list is not preset in qs" in {
      getSeqFromQS("notakey", fullQueryString) should equal (Seq())
    }
    "should return empty list if element is an empty list" in {
      getSeqFromQS("notarealvalue", fullQueryString) should equal (Seq())
    }
  }

  "fromQueryString" - {
    "should return a wfquery object" in {
      fromQueryString(fullQueryString) should equal (WfQuery(
        section= Seq(Section("AU News"), Section("Technology")),
        dueTimes = Seq(WfQueryTime(Some(new DateTime("2015-06-26T23:00:00.000Z")), Some(new DateTime("2015-06-28T23:00:00.000Z")))),
        status = Seq(Status("Writers"), Status("Desk")),
        contentType = Seq("liveblog", "gallery"),
        flags = Seq(Flag.Required),
        prodOffice = Seq("AU"),
        creationTimes = Nil,
        text = None,
        assignedTo = Nil,
        assignedToEmail = Seq("lindsey.dew@guardian.co.uk"),
        inIncopy = Some(true),
        state = Some(DraftState),
        touched = Nil,
        viewTimes = None,
        trashed=false
      ))
    }

  }
}
