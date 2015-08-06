package lib

import models._
import org.joda.time.DateTime

import scala.util.Random

object TestData {


  val titles: List[String] = List("Title", "Hello", "Working Title")
  val prodOffice: List[String] = List("UK","US","AU")
  val priority: List[Int] = List(-2,-1,0,1,2)
  val section: List[String] = List("Arts","Business","Cities","Environment","Film")
  val needsLegal: List[Flag.Flag] = List(Flag.NotRequired, Flag.Complete, Flag.Required)
  val notes: List[Option[String]] = List(Some("one"), Some("two"), Some("three"), Some("four"), None)
  val assignee: List[String] = List("testcake@testcake.com", "google@google.com", "facebook@facebook.com")


  def chooseDate: DateTime = DateTime.now().minusHours(scala.util.Random.nextInt(120))

  def chooseItem[A](list: List[A]): A = list(scala.util.Random.nextInt(list.size-1))

  def chooseBool: Boolean = scala.util.Random.nextInt(2) % 2 == 0

  def opt[A](a: A): Option[A] = if(chooseBool) Some(a) else None

  def randomContentItem(): ContentItem = {
    contentItem(generateRandomStub(), Some(defaultWorkflow()))
  }

  def generateTestData(size: Int = 50, acc: List[ContentItem]=Nil): List[ContentItem] = {
    if(size == 0) acc
    else generateTestData(size-1,randomContentItem()::acc)
  }


  def generateRandomStub(): Stub = {
    Stub(title = chooseItem(titles),
      section = chooseItem(section),
      due = opt(chooseDate),
      assignee = opt(chooseItem(assignee)),
      assigneeEmail = opt(chooseItem(assignee)),
      priority = chooseItem(priority),
      needsLegal = chooseItem(needsLegal),
      note = chooseItem(notes),
      prodOffice = chooseItem(prodOffice),
      createdAt = chooseDate,
      lastModified = chooseDate,
      trashed = chooseBool
    )
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
