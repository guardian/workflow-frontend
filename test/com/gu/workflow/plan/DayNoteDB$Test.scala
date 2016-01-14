package com.gu.workflow.plan

import com.gu.workflow.db.DayNoteDB
import com.gu.workflow.query.WfQuery
import com.gu.workflow.test.CommonDBIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import models.ContentItem
import org.scalatest.{FreeSpec, Matchers}


class DayNoteDBTest extends FreeSpec with CommonDBIntegrationSuite  with Matchers {

  val dayNote = generateDayNote()

  "Should retrieve a day note inserted" - {
    "get day note by id" in {
      val dayNoteFromDB = createDayNote(dayNote)
      DayNoteDB.getDayNoteById(dayNoteFromDB.id) should equal (Some(dayNoteFromDB))
    }

    "should return none if not inserted" in {
      DayNoteDB.getDayNoteById(4L) should equal (None)
    }
  }
}
