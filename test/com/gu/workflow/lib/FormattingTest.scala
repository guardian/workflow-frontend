  package com.gu.workflow.lib
import Formatting._
import com.gu.workflow.query._
import models.{Status, Flag, Section}
import org.joda.time.{DateTimeZone, DateTime}

import org.scalatest.{FreeSpec, Matchers}

class FormattingTest extends FreeSpec with Matchers {

  "parseDate" - {
    "should parse a date time param" in {
      parseDate("2015-06-21T23:00:00.000Z") should equal (Some(new DateTime("2015-06-21T23:00:00.000Z")))
    }
    "should return none if not valid datetime" in {
      parseDate("sdfjkl") should equal (None)
      parseDate("") should equal (None)
    }
  }

  "parseBoolean" - {
    "should parse a valid boolean" in {
      parseBoolean("true") should equal (Some(true))
      parseBoolean("false") should equal (Some(false))
      parseBoolean("notabool") should equal (None)
      parseBoolean("") should equal (None)
    }
  }

  "parseSection" - {
    "should promote a string to a models.Section" in {
      parseSection("section") should equal (Section("section"))
    }
  }

  "parseFlag" - {
    "should parse a valid flag" in {
      parseFlag("needsLegal") should equal (Some(Flag.Required))
      parseFlag("approved") should equal (Some(Flag.Complete))
      parseFlag("notRequired") should equal (Some(Flag.NotRequired))
      parseFlag("notflag") should equal (None)
      parseFlag("") should equal (None)
    }
  }

  "parseContentState" - {
    "should parse a valid content state" in {
      parseContentState("published") should equal (PublishedState)
      parseContentState("takendown") should equal (TakenDownState)
      parseContentState("scheduled") should equal (ScheduledState)
      parseContentState("embargoed") should equal (EmbargoedState)
      parseContentState("draft") should equal (DraftState)
      parseContentState("notavalidcontentstate") should equal (UnknownState("notavalidcontentstate"))
      parseContentState("") should equal (UnknownState(""))
    }
  }

  "parseStatus" - {
    "should parse a valid status " in {
      parseStatus("Stub") should equal (Some(Status("Stub")))
      parseStatus("Writers") should equal (Some(Status("Writers")))
      parseStatus("Subs") should equal (Some(Status("Subs")))
      parseStatus("Production Editor") should equal (Some(Status("Production Editor")))
      parseStatus("Revise") should equal (Some(Status("Revise")))
      parseStatus("Final") should equal (Some(Status("Final")))
      parseStatus("Hold") should equal (Some(Status("Hold")))
      parseStatus("notavalidstatus") should equal (None)
      parseStatus("") should equal (None)
    }
  }
}

