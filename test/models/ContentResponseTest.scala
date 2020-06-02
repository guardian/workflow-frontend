package models

import com.gu.workflow.test.lib.TestData._
import models.api.ContentResponse
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class ContentResponseTest extends AnyFreeSpec with Matchers {

  def withStatus(st: String): Stub => Stub = s => s.copy(externalData = s.externalData.map(_.copy(status = Status.withName(st))))

  "statusCountsMap" -    {
    "should give a map of status to count" in {
      val writers = generateTestData(3).map(withStatus("Writers"))
      val desk = generateTestData(2).map(withStatus("Desk"))
      val subs = generateTestData(1).map(withStatus("Subs"))
      val hold = generateTestData(1).map(withStatus("Hold"))

      val testData = writers:::desk:::subs:::hold

      val statusCountsMap = ContentResponse.statusCountsMap(testData)

      statusCountsMap.get("Writers") should equal (Some(3))
      statusCountsMap.get("Desk") should equal (Some(2))
      statusCountsMap.get("Subs") should equal (Some(1))
      statusCountsMap.get("Hold") should equal (Some(1))
      statusCountsMap.get("total") should equal (Some(7))

    }
  }

  "contentGroupedByStatus" - {
    "should give map of status to dashboard row" in {
      val writers = generateTestData(3).map(withStatus("Writers"))
      val subs = generateTestData(1).map(withStatus("Subs"))
      val hold = generateTestData(2).map(withStatus("Hold"))
      val revise = generateTestData(1).map(withStatus("Revise"))
      val testData = writers ::: subs ::: hold ::: revise

      val content = ContentResponse.contentGroupedByStatus(testData)

      content.get("Writers") should equal (Some(writers))
      content.get("Subs") should equal (Some(subs))
      content.get("Hold") should equal (Some(hold))
      content.get("Revise") should equal (Some(revise))
    }

  }


  "fromStubs" -  {
    "should give a list of stubs, map of status to content item and a totals map" in {
      val writers = generateTestData(3).map(withStatus("Writers"))
      val subs = generateTestData(1).map(withStatus("Subs"))
      val revise = generateTestData(1).map(withStatus("Revise"))
      val `final` = generateTestData(6).map(withStatus("Final"))

      val testData = writers ::: subs ::: revise ::: `final`

      val statusCountsMap = ContentResponse.statusCountsMap(testData)
      val contentGroupedByStatus = ContentResponse.contentGroupedByStatus(testData)

      val cr = ContentResponse.fromStubItems(testData)

      cr.content should equal (contentGroupedByStatus)
    }
  }

}
