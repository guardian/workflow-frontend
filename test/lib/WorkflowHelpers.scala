package test

import com.gu.workflow.db.CommonDB
import lib.{PostgresDB}
import models._
import org.joda.time.DateTime
import scala.util.Random
import scala.util.Random._
import play.api.db.slick.DB

import play.api.Play.current

trait WorkflowHelpers {

  case class ContentItemWithCollaborators(contentItem: ContentItem, collaborators: List[User] = Nil)

  def createContent(item: ContentItem): Option[ContentItem] = {
    val stubId = PostgresDB.createContent(item)
    stubId.fold(err => None, apiSucc => Some(ContentItem(item.stub.copy(Some(apiSucc.data)), item.wcOpt)))
  }

  // returns 'content' for chaining
  def addCollaborators(content: ContentItem, collaborators: List[User]) =
    DB.withSession { implicit session =>
      content.wcOpt.map( c =>
        CommonDB.addCollaborators(content.wcOpt, collaborators.toList, c.composerId)
      )
      content
    }

//default stub, default workflow item?
  def contentItem(stub: Stub, wcOpt: Option[WorkflowContent]=None): ContentItem = {
    ContentItem(
      stub.copy(composerId = wcOpt.map(wc => wc.composerId)),
      wcOpt
    )
  }


  def defaultStub(title: String = "Title",
                  prodOffice: String = "UK",
                  priority: Int = 1,
                  section: String = "Section",
                  needsLegal:  Flag.Flag = Flag.NotRequired,
                  due: Option[DateTime] = None,
                  createdAt: DateTime = DateTime.now(),
                  lastModified: DateTime = DateTime.now()) = {
    Stub(title = title,
        prodOffice = prodOffice,
        priority = priority,
        section = section,
        needsLegal = needsLegal,
        due = due,
        createdAt = createdAt,
        lastModified = lastModified
    )
  }

  def defaultWorkflow(contentType: String = "article",
                       status: Status = Status("Writers"),
                       lastModified: DateTime = DateTime.now(),
                       lastModifiedBy: Option[String] = Some("testbunny"),
                       published: Boolean = false,
                       timePublished: Option[DateTime] = None,
                       activeInInCopy: Boolean = false,
                       storyBundleId: Option[String] = None,
                       timeTakenDown: Option[DateTime] = None,
                       scheduledLaunchDate: Option[DateTime] = None,
                       embargoedUntil: Option[DateTime] = None,
                       takenDown: Boolean = false) = {
      val composerIdRng = Random.nextDouble.toString

      WorkflowContent(
        composerId =composerIdRng,
        path = None,
        headline = None,
        standfirst = None,
        trailtext = None,
        mainMedia = Some(WorkflowContentMainMedia()),
        trailImageUrl = None,
        contentType = contentType,
        section = None,
        status = status,
        lastModified = lastModified,
        lastModifiedBy = lastModifiedBy,
        published = published,
        timePublished = timePublished,
        storyBundleId = storyBundleId,
        activeInInCopy = activeInInCopy,
        takenDown = takenDown,
        timeTakenDown = None,
        wordCount = 0,
        launchScheduleDetails = Some(LaunchScheduleDetails(scheduledLaunchDate=None, embargoedUntil=None, embargoedIndefinitely=false)),
        statusFlags = WorkflowContentStatusFlags(
          commentable = false,
          optimisedForWeb = false,
          optimisedForWebChanged = false
        )
      )
  }

}
