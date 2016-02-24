package models

import org.scalatest.{Matchers, FreeSpec}
import org.specs2.mutable.Specification
import com.gu.workflow.test.lib.TestData._

class ContentResponseTest extends FreeSpec with Matchers {

  "statusCountsMap" -    {
    "should give a map of status to count" in {
      //create
      val stubOnly = generateTestData(2, 1.0)
      val stubAndWCContent = generateTestData(8, 0.0)
      val testData = stubOnly:::stubAndWCContent


      val statusCountsMap = ContentResponse.statusCountsMap(testData)
      statusCountsMap.get("Stub") should equal (2)
      statusCountsMap.get("Writers") should equal (4)

    }
  }

  "fromContentItems" in  {
    val stubOnly = generateTestData(2, 1.0)
    val stubAndWCContent = generateTestData(8, 0.0)
    val testData = stubOnly:::stubAndWCContent
    val statusCountsMap = ContentResponse.statusCountsMap(testData)

    ContentResponse.fromContentItems(testData) should equal (ContentResponse(stubOnly.map(_.stub), Map[String, List[DashboardRow]](),statusCountsMap))

  }

}
