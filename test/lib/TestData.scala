package lib

import models._
import org.joda.time.DateTime
import test.Config

object TestData {

  val randomSeed = Config.randomSeed.getOrElse(scala.util.Random.nextLong)
  println(s"Using random seed: $randomSeed")
  private val random = new scala.util.Random(randomSeed)

  val text: List[String] = List("Title", "Hello", "Working Title")
  val prodOffice: List[String] = List("UK","US","AU")
  val priority: List[Int] = List(-2,-1,0,1,2)
  val section: List[String] = List("Arts","Business","Cities","Environment","Film")
  val needsLegal: List[Flag.Flag] = List(Flag.NotRequired, Flag.Complete, Flag.Required)
  val user: List[String] = List("testcake@testcake.com", "google@google.com", "facebook@facebook.com")
  val status: List[Status] = Status.All
  val contentType: List[String] = List("article","gallery","live-blog","video","interactive","picture")


  def chooseDate: DateTime = DateTime.now().minusHours(random.nextInt(120))

  def chooseItem[A](list: List[A]): A = list(random.nextInt(list.size-1))

  def chooseBool: Boolean = random.nextInt(2) % 2 == 0

  def opt[A](a: A): Option[A] = if(chooseBool) Some(a) else None

  def chooseId: String = random.nextDouble.toString

  def chooseInt: Int = random.nextInt

  def randomContentItem(): ContentItem = {
    contentItem(generateRandomStub(), Some(generateRandomWC()))
  }

  def generateTestData(size: Int = 50, acc: List[ContentItem]=Nil): List[ContentItem] = {
    if(size == 0) acc
    else generateTestData(size-1,randomContentItem()::acc)
  }


  def generateRandomStub(): Stub = {
    //todo-handle the trashed logic better
    Stub(title = chooseItem(text),
      section = chooseItem(section),
      due = opt(chooseDate),
      assignee = opt(chooseItem(user)),
      assigneeEmail = opt(chooseItem(user)),
      priority = chooseItem(priority),
      needsLegal = chooseItem(needsLegal),
      note = opt(chooseItem(text)),
      prodOffice = chooseItem(prodOffice),
      createdAt = chooseDate,
      lastModified = chooseDate,
      trashed = false
    )
  }

  def generateRandomWC(): WorkflowContent = {
    val composerIdRng = random.nextDouble.toString


    WorkflowContent(
      composerId =composerIdRng,
      path = opt(chooseItem(text)),
      headline = opt(chooseItem(text)),
      standfirst = opt(chooseItem(text)),
      trailtext = opt(chooseItem(text)),
      mainMedia = Some(WorkflowContentMainMedia()),
      trailImageUrl = None,
      contentType = chooseItem(contentType),
      section = None,
      status = chooseItem(status),
      lastModified = chooseDate,
      lastModifiedBy = opt(chooseItem(user)),
      published = false,
      timePublished = opt(chooseDate),
      storyBundleId = opt(chooseId),
      activeInInCopy = chooseBool,
      takenDown = chooseBool,
      timeTakenDown = opt(chooseDate),
      wordCount = chooseInt,
      launchScheduleDetails = Some(LaunchScheduleDetails(scheduledLaunchDate=opt(chooseDate), embargoedUntil=opt(chooseDate), embargoedIndefinitely=chooseBool)),
      statusFlags = WorkflowContentStatusFlags(
        commentable = chooseBool,
        optimisedForWeb = chooseBool,
        optimisedForWebChanged = chooseBool
      )
    )

  }

  //default stub, default workflow item?
  def contentItem(stub: Stub, wcOpt: Option[WorkflowContent]=None): ContentItem = {
    ContentItem(
      stub.copy(composerId = wcOpt.map(wc => wc.composerId)),
      wcOpt
    )
  }


//todo - deprecate default stub/wc
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
    val composerIdRng = random.nextDouble.toString

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
