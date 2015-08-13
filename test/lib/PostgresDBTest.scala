package lib

import com.gu.workflow.db.CommonDB
import com.gu.workflow.query.WfQuery
import models.{ContentItem, Stub, DashboardRow}
import org.scalatest.{Matchers, FreeSpec}
import test.WorkflowIntegrationSuite
import com.gu.workflow.test.lib.TestData._


class PostgresDBTest extends FreeSpec with WorkflowIntegrationSuite with Matchers  {

  //todo - work on a randomiser
  val testData = generateTestData()
  "test the eq" - {
    "no filter" in withTestData(testData) { dataInserted =>
      val q = WfQuery()

      val stubs: List[Stub] = CommonDB.getStubs(q, unlinkedOnly=true)
      val dashboard: List[DashboardRow] = PostgresDB.getContent(q)
      val contentItems: List[ContentItem] = PostgresDB.getContentItems(q)

      val stubsTmp = DashboardRow.fromContentItems(contentItems)._1
      val dashboardTmp = DashboardRow.fromContentItems(contentItems)._2
      println("TEST DATA" + testData.filter(ci => !ci.stub.trashed).map(ci => (ci.stub.id, ci.wcOpt.map(_.composerId))))

      println("STUBS: " + stubs.map(_.id))
      println("STUBSTMP: " + stubsTmp.map(_.id))
      println("DASHBOARD" + dashboard.map(_.wc.composerId))
      println("DASHBOARDMTP" + dashboardTmp.map(_.wc.composerId))
//      stubsTmp.map(_.id) should equal (stubs.map(_.id))
//      dashboardTmp should equal (dashboard)
    }

    "text search filter" ignore withTestData(testData) { dataInserted =>
      val q = WfQuery(text=Some("ti"))

      val stubs: List[Stub] = CommonDB.getStubs(q, unlinkedOnly=true)
      val dashboard: List[DashboardRow] = PostgresDB.getContent(q)
      val contentItems: List[ContentItem] = PostgresDB.getContentItems(q)

      val stubsTmp = DashboardRow.fromContentItems(contentItems)._1
      val dashboardTmp = DashboardRow.fromContentItems(contentItems)._2

      stubsTmp should equal (stubs)
      dashboardTmp should equal (dashboard)

    }
  }




}
