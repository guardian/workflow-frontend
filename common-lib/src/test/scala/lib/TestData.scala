package com.gu.workflow.test.lib

import com.gu.workflow.query._
import models._
import models.api.ContentUpdateSerialisedEvent
import org.joda.time.DateTime
import com.gu.workflow.test.Config
import play.api.libs.json.{JsObject, Json, JsValue}

object TestData {

  val randomSeed = Config.randomSeed.getOrElse(scala.util.Random.nextLong)
  println(s"Using random seed: $randomSeed")
  private val random = new scala.util.Random(randomSeed)

  val text: List[String] = List("Title", "Hello", "Working Title", "More", "Words", "Blah", "path", "jelly")
  val prodOffices: List[String] = List("UK","US","AU")
  val priority: List[Int] = List(-2,-1,0,1,2)
  val sections: List[String] = List("Arts","Business","Cities","Environment","Film")
  val needsLegal: List[Flag.Flag] = List(Flag.NotRequired, Flag.Complete, Flag.Required)
  val email: List[String] = List("testcake@testcake.com", "google@google.com", "facebook@facebook.com")
  val statuses: List[Status] = Status.All
  val contentTypes: List[String] = List("article","gallery","live-blog","video","interactive","picture")
  val state: List[ContentState] = List(PublishedState, TakenDownState, ScheduledState, EmbargoedState, DraftState)
  val users: List[User] = List(User("testcake@testcake.com", "test", "cake"), User("google@google.com", "goo", "gle"), User("facebook@facebook.com", "face", "book"))
  val commissioningDesks: List[String] = List("Hogwarts,The Burrow", "Privet Drive,London", "Hogsmeade")

  //select a date anywhere between now and the last 50 days
  def chooseDate: DateTime = DateTime.now().minusHours(random.nextInt(24*50))

  def chooseItem[A](list: List[A]): A = list(random.nextInt(list.size-1))

  def chooseList[A](list: List[A]): List[A] = list.take(random.nextInt(list.size-1))

  def chooseBool: Boolean = random.nextInt(2) % 2 == 0

  def opt[A](a: A): Option[A] = if(chooseBool) Some(a) else None

  def chooseId: String = random.nextDouble.toString

  def chooseInt: Int = random.nextInt

  def chooseLong: Long = random.nextLong

  def randomContentItem(stubProbability: Double = 0.2): ContentItem = {
    val stub = generateRandomStub()
    val content =
      if(random.nextDouble() < stubProbability) None else Some(generateRandomWC())
    contentItem(stub, content)
  }

  def randomStub = randomContentItem(stubProbability = 1.0)
  def randomStubAndWC = randomContentItem(stubProbability = 0.0)

  //todo - genericise these methods over types
  def generateTestData(size: Int = 50,
                       stubProbability: Double = 0.2,
                       acc: List[ContentItem]=Nil): List[ContentItem] = {
    if(size == 0) acc
    else generateTestData(size-1,stubProbability,randomContentItem(stubProbability)::acc)
  }

  def composerIdsFromContentItems(contentItems: List[ContentItem]) : List[String] = contentItems.flatMap(_.wcOpt.map(_.composerId))

  def contentItemWithSetDateTrashedAndStatus(newLastModified: DateTime, newStatus: String = "Writers",
    stubProbability: Int = 0, newEmbargoedIndefinitely: Boolean = false, newTrashed: Boolean = false): ContentItem = {
    val rci = randomContentItem(stubProbability)
    val lsd = rci.wcOpt.map(_.launchScheduleDetails)
    rci.copy(stub=rci.stub.copy(lastModified = newLastModified, trashed=newTrashed),
      wcOpt=rci.wcOpt.map(wc => wc.copy(
        status=Status(newStatus),
        lastModified=newLastModified,
        launchScheduleDetails = lsd.get.copy(embargoedIndefinitely=newEmbargoedIndefinitely))
      )
    )
  }

  def contentItemWithSetDateAndPublished(newLastModified: DateTime, newPublished: Boolean, newStatus: String = "Writers"): ContentItem = {
    val rci = randomContentItem(0)
    rci.copy(stub=rci.stub.copy(lastModified = newLastModified),
      wcOpt=rci.wcOpt.map(wc => wc.copy(
        published=newPublished,
        lastModified=newLastModified,
        status = Status(newStatus))
      )
    )
  }

  def generateRandomSizeCollaborators(): List[User] = {
    val size = random.nextInt(10)
    generateCollaborates(size)
  }

  def generateCollaborates(size: Int=10, acc: List[User]=Nil): List[User] = {
    if(size == 0) acc
    else generateCollaborates(size-1,generateUser()::acc)
  }


  def generateDesks(size: Int = 5, acc: List[Desk]=Nil): List[Desk] = {
    if(size == 0) acc
    else generateDesks(size-1, generateDesk()::acc)
  }

  def generateSections(size: Int = 5, acc: List[Section]=Nil): List[Section] = {
    if(size == 0) acc
    else generateSections(size-1, generateSection()::acc)
  }

  def generateRandomStub(): Stub = {
    Stub(title = chooseItem(text),
      section = chooseItem(sections),
      due = opt(chooseDate),
      assignee = opt(chooseItem(email)),
      assigneeEmail = opt(chooseItem(email)),
      priority = chooseItem(priority),
      needsLegal = chooseItem(needsLegal),
      note = opt(chooseItem(text)),
      prodOffice = chooseItem(prodOffices),
      createdAt = chooseDate,
      contentType = chooseItem(contentTypes),
      lastModified = chooseDate,
      trashed = chooseBool,
      commissioningDesks = opt(chooseItem(commissioningDesks))
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
      trailImageUrl = opt(chooseItem(text)),
      contentType = chooseItem(contentTypes),
      status = chooseItem(statuses),
      lastModified = chooseDate,
      lastModifiedBy = opt(chooseItem(email)),
      published = chooseBool,
      timePublished = opt(chooseDate),
      storyBundleId = opt(chooseId),
      activeInInCopy = chooseBool,
      takenDown = chooseBool,
      timeTakenDown = opt(chooseDate),
      wordCount = chooseInt,
      launchScheduleDetails = LaunchScheduleDetails(opt(chooseDate), opt(chooseDate), chooseBool),
      statusFlags = WorkflowContentStatusFlags(
        commentable = chooseBool,
        optimisedForWeb = chooseBool,
        optimisedForWebChanged = chooseBool
      )
    )
  }

  def mainMediaGenerator: WorkflowContentMainMedia= {
    WorkflowContentMainMedia(opt(chooseItem(text)),opt(chooseItem(text)),opt(chooseItem(text)),opt(chooseItem(text)))
  }

  def generateContentUpdateEvent(composerIdOpt: Option[String] = None, revision: Long = 1L): ContentUpdateEvent = {
    ContentUpdateEvent(
      composerId = composerIdOpt.getOrElse(chooseId),
      path = opt(chooseItem(text)),
      headline = opt(chooseItem(text)),
      standfirst = opt(chooseItem(text)),
      trailText = opt(chooseItem(text)),
      mainMedia = mainMediaGenerator,
      whatChanged = chooseItem(text),
      published = chooseBool,
      user = opt(chooseItem(email)),
      lastModified = chooseDate,
      tags = None,
      lastMajorRevisionDate = opt(chooseDate),
      publicationDate = opt(chooseDate),
      thumbnail = opt(chooseItem(text)),
      storyBundleId = opt(chooseId),
      revision = revision,
      wordCount = chooseInt,
      launchScheduleDetails = LaunchScheduleDetails(
        scheduledLaunchDate = opt(chooseDate),
        embargoedUntil = opt(chooseDate),
        embargoedIndefinitely = chooseBool
      ),
      collaborators = chooseList(users),
      statusFlags = WorkflowContentStatusFlags(commentable = chooseBool, optimisedForWeb = chooseBool, optimisedForWebChanged = chooseBool)
    )
  }

  def generateContentUpdateSerialisedEvent(composerIdOpt: Option[String] = None, revision: Long = 1L) = {
    ContentUpdateSerialisedEvent.extract(generateContentUpdateEvent(composerIdOpt, revision))
  }

  def generateDesk(): Desk = {
    Desk(
      name = chooseId,
      selected = false,
      id = chooseLong
    )
  }

  def generateSection(): Section = {
    Section(
      name = chooseId,
      selected = false,
      id = chooseLong
    )
  }

  def generateUser(): User = {
    User(
      email = chooseItem(email),
      firstName = "test",
      lastName = "bunny"
    )
  }

  //default stub, default workflow item?
  def contentItem(stub: Stub, wcOpt: Option[WorkflowContent]=None): ContentItem = {
    ContentItem(
      stub.copy(composerId = wcOpt.map(wc => wc.composerId)),
      wcOpt.map(wc => wc.copy(contentType=stub.contentType))
    )
  }


//todo - deprecate default stub/wc
  def defaultStub(title: String = "Title",
                  prodOffice: String = "UK",
                  priority: Int = 1,
                  section: String = "Section",
                  needsLegal:  Flag.Flag = Flag.NotRequired,
                  due: Option[DateTime] = None,
                  contentType: String = "article",
                  createdAt: DateTime = DateTime.now(),
                  lastModified: DateTime = DateTime.now(),
                  commissioningDesks: Option[String] = None) = {
    Stub(title = title,
      prodOffice = prodOffice,
      priority = priority,
      section = section,
      needsLegal = needsLegal,
      due = due,
      createdAt = createdAt,
      lastModified = lastModified,
      contentType = contentType,
      commissioningDesks = commissioningDesks
    )
  }

}
