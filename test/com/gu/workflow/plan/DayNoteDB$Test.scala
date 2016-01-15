package com.gu.workflow.plan

import com.gu.workflow.db.{DayNoteQuery, DayNoteDB}
import com.gu.workflow.query.WfQuery
import com.gu.workflow.test.CommonDBIntegrationSuite
import com.gu.workflow.test.lib.TestData._
import models.ContentItem
import org.joda.time.DateTime
import org.scalatest.{FreeSpec, Matchers}


class DayNoteDBTest extends FreeSpec with CommonDBIntegrationSuite  with Matchers {

  val dayNote = generateDayNote()

  val dayNotes = generateDayNotes()

  "Should retrieve a day note inserted" - {
    "get day note by id" in {
      val dayNote = generateDayNote()
      val newsList = generateNewsList()
      val dayNoteFromDB = createDayNote(dayNote, newsList)
      DayNoteDB.getDayNoteById(dayNoteFromDB.id) should equal (Some(dayNoteFromDB))
    }

    "should return none if not inserted" in {
      DayNoteDB.getDayNoteById(4L) should equal (None)
    }
  }

  "Should delete a day note" - {
    "delete day not that exists" in {
      val dayNote = generateDayNote()
      val newsList = generateNewsList()
      val dayNoteFromDB = createDayNote(dayNote, newsList)
      DayNoteDB.deleteDayNote(dayNoteFromDB) should equal (Some(dayNoteFromDB.id))
    }

    "return none if item doesn't exist" in {
      val dayNote = generateDayNote()
      DayNoteDB.deleteDayNote(dayNote) should equal (None)
    }
  }

  "Should update a field" - {
    "update a note" in {
      val dayNote = generateDayNote()
      val newsList = generateNewsList()
      val dayNoteFromDB = createDayNote(dayNote, newsList)
      DayNoteDB.updateDayNote(dayNoteFromDB.id, "note", "notevalue")
      DayNoteDB.getDayNoteById(dayNoteFromDB.id).map(_.note) should equal (Some("notevalue"))
    }

    "update a day" in {
      val dayNote = generateDayNote()
      val newsList = generateNewsList()
      val dayNoteFromDB = createDayNote(dayNote, newsList)
      val now = DateTime.now()
      DayNoteDB.updateDayNote(dayNoteFromDB.id, "day", now) should equal (Some(dayNoteFromDB.id))
      DayNoteDB.getDayNoteById(dayNoteFromDB.id).map(_.day) should equal (Some(now))
    }

    "update a day note that doesn't exist" in {
      val dayNote = generateDayNote()
      DayNoteDB.updateDayNote(dayNote.id, "note", "dsfdf") should equal (None)
    }
  }

  "Should be able to query with filters" - {
    "no filters set" in withDayNoteTestData(dayNotes) { dataInserted =>
      DayNoteDB.getDayNotesByQuery(DayNoteQuery(None, None, None)) should equal (Some(dataInserted))
    }
  }
}
