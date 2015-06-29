package lib

import com.gu.workflow.query.{DraftState, WfQueryTime, WfQuery}
import models.{Flag, Status, Section}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec, FunSuite}

import scala.collection.mutable
import RequestParameters._


class RequestParametersTest extends FreeSpec with  Matchers {

  val fullQueryString = Map("state" -> mutable.Buffer("draft"),
                            "assigneeEmail" -> mutable.Buffer("lindsey.dew@guardian.co.uk"),
                            "flags" -> mutable.Buffer("needsLegal"),
                            "prodOffice" -> mutable.Buffer("AU"),
                            "section" -> mutable.Buffer("AU News", "Technology"),
                            "content-type" -> mutable.Buffer("liveblog","gallery"),
                            "status" -> mutable.Buffer("Writers","Desk"),
                            "due.from" -> mutable.Buffer("2015-06-26T23:00:00.000Z"),
                            "due.until" -> mutable.Buffer("2015-06-28T23:00:00.000Z"),
                            "incopy" -> mutable.Buffer("true"),
                            "notarealvalue" -> mutable.Buffer()
                            )

  val composerQuery = Map("composerId" ->  mutable.Buffer("1234"))

  "getOptionFromQS" - {
    "should return element if present" in {
      getOptionFromQS("state", fullQueryString) should equal (Some("draft"))
    }
    "should return head element if multiple in the list" in {
      getOptionFromQS("content-type", fullQueryString) should equal (Some("liveblog"))
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
    "should return list elements if multiple in the list" in {
      getSeqFromQS("content-type", fullQueryString) should equal (Seq("liveblog", "gallery"))
    }
    "should return empty list is not preset in qs" in {
      getSeqFromQS("notakey", fullQueryString) should equal (Seq())
    }
    "should return empty list if element is an empty list" in {
      getSeqFromQS("notarealvalue", fullQueryString) should equal (Seq())
    }
  }

  "getComposerId" - {
    "should return composerId if in qsstring" in {
      getComposerId(composerQuery) should equal (Some("1234"))
      getComposerId(fullQueryString) should equal (None)
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
