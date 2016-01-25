package com.gu.workflow.admin

import com.gu.workflow.db.{CommonDB, DeskDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import models.WorkflowContent
import org.scalatest.{Matchers, FreeSpec}
import com.gu.workflow.test.lib.TestData._

class DeskDBTest extends FreeSpec with CommonDBIntegrationSuite with Matchers {

  "Should retrieve desks" in withDesksTestData(generateDesks()) { dataInserted =>
    DeskDB.deskList should equal(dataInserted)
  }

  "Should insert a desk with a unique name and take no action if desk already exists" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    val deskFromDB = DeskDB.getByName(desk.name)
    deskFromDB.isDefined should equal (true)
  }

  "Should do nothing if the upsert is called on a desk with the same name" in {
    val desk = generateDesk()
    DeskDB.upsert(desk) should equal(1)
    DeskDB.upsert(desk) should equal(0)

  }

  "Should remove a desk" in {
    val desk = generateDesk()
    val deskFromDB = createDesk(desk)
    DeskDB.remove(desk) should equal (1)
    DeskDB.getByName(deskFromDB.name) should equal(None)
  }

  val contentItem = randomContentItem(0.0)
  //todo - put this in its own file
  "should update content" in withTestData(List(contentItem)) { dataInserted =>
//    //todo - tidy up the implicit logic on whether or not a wc item exists
    val contentUpdate = generateContentUpdateEvent(dataInserted.head.stub.composerId)
    CommonDB.getContentForComposerId(dataInserted.head.stub.composerId.get) should equal (dataInserted.head.wcOpt)
    CommonDB.updateContentFromUpdateEvent(contentUpdate)
    val tmp = CommonDB.getContentForComposerId(dataInserted.head.stub.composerId.get)
    val tmp1 = tmp.get

    tmp1.path should equal (contentUpdate.path)
    tmp1.lastModified should equal (contentUpdate.lastModified)
    tmp1.lastModifiedBy should equal (contentUpdate.user)
    tmp1.contentType should equal (contentUpdate.`type`)
    tmp1.statusFlags.commentable should equal (contentUpdate.statusFlags.commentable)
    tmp1.statusFlags.optimisedForWeb should equal (contentUpdate.statusFlags.optimisedForWeb)
    tmp1.statusFlags.optimisedForWebChanged should equal (contentUpdate.statusFlags.optimisedForWebChanged)
    tmp1.headline should equal (contentUpdate.headline)
    tmp1.standfirst should equal (contentUpdate.standfirst)
    tmp1.trailtext should equal (contentUpdate.trailText)
    tmp1.trailImageUrl should equal (WorkflowContent.getTrailImageUrl(contentUpdate.thumbnail))
    tmp1.published should equal (contentUpdate.published)
    tmp1.wordCount should equal (contentUpdate.wordCount)
    tmp1.storyBundleId should equal (contentUpdate.storyBundleId)
    tmp1.launchScheduleDetails.embargoedUntil should equal (contentUpdate.launchScheduleDetails.embargoedUntil)
    tmp1.launchScheduleDetails.embargoedIndefinitely should equal (contentUpdate.launchScheduleDetails.embargoedIndefinitely)
    tmp1.launchScheduleDetails.scheduledLaunchDate should equal (contentUpdate.launchScheduleDetails.scheduledLaunchDate)


  }


}
