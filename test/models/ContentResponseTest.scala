package models

import org.scalatest.{Matchers, FreeSpec}
import org.specs2.mutable.Specification
import com.gu.workflow.test.lib.TestData._

class ContentResponseTest extends FreeSpec with Matchers {

  def withStatus(st: String): ContentItem => ContentItem = c => ContentItem(c.stub, c.wcOpt.map(wc => wc.copy(status=Status(st))))

  "statusCountsMap" -    {
    "should give a map of status to count" in {
      val stubOnly = generateTestData(2, 1.0)
      val writers = generateTestData(3, 0.0).map(withStatus("Writers")).toList
      val desk = generateTestData(2, 0.0).map(withStatus("Desk")).toList
      val subs = generateTestData(1, 0.0).map(withStatus("Subs")).toList
      val hold = generateTestData(1, 0.0).map(withStatus("Hold")).toList

      val testData = stubOnly:::writers:::desk:::subs:::hold

      val statusCountsMap = ContentResponse.statusCountsMap(testData)

      statusCountsMap.get("Stub") should equal (Some(2))
      statusCountsMap.get("Writers") should equal (Some(3))
      statusCountsMap.get("Desk") should equal (Some(2))
      statusCountsMap.get("Subs") should equal (Some(1))
      statusCountsMap.get("Hold") should equal (Some(1))
      statusCountsMap.get("total") should equal (Some(9))

    }
  }

  "contentGroupedByStatus" - {
    "should give map of status to dashboard row" in {
      val stubOnly = generateTestData(2, 1.0)
      val writers = generateTestData(3, 0.0).map(withStatus("Writers")).toList
      val subs = generateTestData(1, 0.0).map(withStatus("Subs")).toList
      val hold = generateTestData(2, 0.0).map(withStatus("Hold")).toList
      val revise = generateTestData(1, 0.0).map(withStatus("Revise")).toList
      val testData = stubOnly ::: writers ::: subs ::: hold ::: revise

      val content = ContentResponse.contentGroupedByStatus(testData)

      content.get("Writers") should equal (Some(writers))
      content.get("Subs") should equal (Some(subs))
      content.get("Hold") should equal (Some(hold))
      content.get("Revise") should equal (Some(revise))
    }

  }


  "fromContentItems" -  {
    "should give a list of stubs, map of status to content item and a totals map" in {
      val stubOnly = generateTestData(2, 1.0)
      val writers = generateTestData(3, 0.0).map(withStatus("Writers")).toList
      val subs = generateTestData(1, 0.0).map(withStatus("Subs")).toList
      val revise = generateTestData(1, 0.0).map(withStatus("Revise")).toList
      val `final` = generateTestData(6, 0.0).map(withStatus("Final")).toList

      val testData = stubOnly ::: writers ::: subs ::: revise ::: `final`

      val statusCountsMap = ContentResponse.statusCountsMap(testData)
      val contentGroupedByStatus = ContentResponse.contentGroupedByStatus(testData)

      ContentResponse.fromContentItems(testData) should equal(ContentResponse(contentGroupedByStatus, stubOnly.map(_.stub), statusCountsMap))
    }
  }

}
