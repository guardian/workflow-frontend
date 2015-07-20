package lib

import com.gu.workflow.query.{DateRange, DraftState, WfQueryTime, WfQuery}
import models.{Flag, Status, Section}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec, FunSuite}
import play.api.test.FakeRequest

import scala.collection.mutable
import RequestParameters._

import scala.collection.mutable.ArrayBuffer


class RequestParametersTest extends FreeSpec with  Matchers {

  val qsString = Map("assigneeEmail" -> ArrayBuffer("lindsey.dew@guardian.co.uk"),
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
      getOptionFromQS("state", qsString) should equal (Some("draft"))
    }

    "should return none if key is not preset in qs" in {
      getOptionFromQS("notakey", qsString) should equal (None)
    }
    "should return none if element is an empty list" in {
      getOptionFromQS("notarealvalue", qsString) should equal (None)
    }
  }

  "getOptionFromQS" - {
    "should return list element if present" in {
      getSeqFromQS("state", qsString) should equal (Seq("draft"))
    }

    "should return empty list is not preset in qs" in {
      getSeqFromQS("notakey", qsString) should equal (Seq())
    }
    "should return empty list if element is an empty list" in {
      getSeqFromQS("notarealvalue", qsString) should equal (Seq())
    }
  }

  "fromQueryString" - {
    "should return a wfquery object" in {
      val queryData = WfQuery(
        section= Seq(Section("Developer+Blog"),Section("Arts")),
        dueTimes = Seq(WfQueryTime(Some(new DateTime("2015-07-03T23:00:00.000Z")), Some(new DateTime("2015-07-05T23:00:00.000Z")))),
        status = Seq(Status("Writers"), Status("Desk")),
        contentType = Seq("article", "liveblog"),
        flags = Seq(Flag.Required, Flag.Complete),
        prodOffice = Nil,
        creationTimes = Seq(WfQueryTime(Some(new DateTime("2015-06-28T23:00:00.000Z")), Some(new DateTime("2015-06-29T23:00:00.000Z")))),
        text = None,
        assignedTo = Nil,
        assignedToEmail = Seq("lindsey.dew@guardian.co.uk"),
        inIncopy = Some(true),
        state = Some(DraftState),
        touched =  Seq("lindsey.dew@guardian.co.uk"),
        viewTimes = Some(DateRange(new DateTime("2015-06-29T23:00:00.000Z"), new DateTime("2015-06-30T23:00:00.000Z"))),
        trashed=false)

      fromQueryString(qsString).section           should equal (queryData.section)
      fromQueryString(qsString).dueTimes          should equal (queryData.dueTimes)
      fromQueryString(qsString).status            should equal (queryData.status)
      fromQueryString(qsString).contentType       should equal (queryData.contentType)
      fromQueryString(qsString).flags             should equal (queryData.flags)
      fromQueryString(qsString).prodOffice        should equal (queryData.prodOffice)
      fromQueryString(qsString).creationTimes     should equal (queryData.creationTimes)
      fromQueryString(qsString).text              should equal (queryData.text)
      fromQueryString(qsString).assignedTo        should equal (queryData.assignedTo)
      fromQueryString(qsString).assignedToEmail   should equal (queryData.assignedToEmail)
      fromQueryString(qsString).inIncopy          should equal (queryData.inIncopy)
      fromQueryString(qsString).state             should equal (queryData.state)
      fromQueryString(qsString).touched           should equal (queryData.touched)
      fromQueryString(qsString).viewTimes         should equal (queryData.viewTimes)
      fromQueryString(qsString).trashed           should equal (queryData.trashed)
    }

  }
}
