package com.gu.workflow.query

import com.gu.workflow.query.FilterTestOps._
import com.gu.workflow.test.lib.TestData._
import models.{ContentItem, Status}
import org.joda.time.DateTime
import org.scalatest.{Matchers, FreeSpec}
import models.ContentItem._
import scala.slick.driver.PostgresDriver.simple._
import com.gu.workflow.test.WorkflowIntegrationSuite

class OneValueFilterTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testData = generateTestData()

  "No parameter set" in {
    val dataInserted = testData.map(createContent(_))
    val query = WfQuery()
    query should selectSameResultsAs (FilterTest(noFilter, dataInserted))
  }

  "Parameter set for field" - {
    "field is composerId" in {
      val dataInserted = testData.map(createContent(_))
      val insertedComposerId = dataInserted.filter(c => c.wcOpt.map(_.composerId).isDefined).headOption.flatMap(_.wcOpt.map(_.composerId))
      val query = WfQuery(composerId=insertedComposerId)
      val oneFilter = FilterTest(c => c.wcOpt.map(_.composerId) == insertedComposerId, dataInserted)
      query should selectSameResultsAs(oneFilter)
    }

    "field is content state" - {

      val isPublished: ContentItem => Boolean = c => c.wcOpt.map(_.published).exists(identity)
      val isTakenDown: ContentItem => Boolean = c => c.wcOpt.map(_.takenDown).exists(identity)

      val inFuture: DateTime => Boolean = d => d isAfter DateTime.now()

      "value is published" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(state=Some(PublishedState))

        val oneFilter = FilterTest(c => published(c).exists(identity), dataInserted)
        query should selectSameResultsAs(oneFilter)
      }

      "value is takendown" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(state=Some(TakenDownState))
        val oneFilter = FilterTest(c => takenDown(c).exists(identity), dataInserted)
        query should selectSameResultsAs(oneFilter)
      }

      "value is scheduled state" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(state=Some(ScheduledState))
        val oneFilter = FilterTest(c => scheduledLaunchDate(c).exists(inFuture), dataInserted)
        query should selectSameResultsAs(oneFilter)
      }

      "value is embargoed state" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(state=Some(EmbargoedState))
        val oneFilter = FilterTest(c => embargoedIndefinitely(c).exists(identity) || embargoedUntil(c).exists(inFuture), dataInserted)
        query should selectSameResultsAs(oneFilter)
      }

      "value is draft state" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(state=Some(DraftState))
        val oneFilter = FilterTest(c => !(isPublished(c) || isTakenDown(c)), dataInserted)
        query should selectSameResultsAs(oneFilter)

      }
    }
    "field is inInCopy" - {
      "value is true" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(inIncopy=Some(true))
        val oneFilter = FilterTest(c => storyBundleId(c).isDefined, dataInserted)
        query should selectSameResultsAs(oneFilter)
      }

      "value is false" in {
        val dataInserted = testData.map(createContent(_))
        val query = WfQuery(inIncopy=Some(false))
        val oneFilter = FilterTest(c => storyBundleId(c).isEmpty, dataInserted)
        query should selectSameResultsAs(oneFilter)
      }
    }
  }

}
