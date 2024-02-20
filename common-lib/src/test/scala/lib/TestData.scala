package com.gu.workflow.test.lib

import com.gu.workflow.query._
import com.gu.workflow.test.Config
import models._
import org.joda.time.DateTime

object TestData {

  val randomSeed = Config.randomSeed.getOrElse(scala.util.Random.nextLong())

  private val random = new scala.util.Random(randomSeed)

  val text: List[String] = List("Title", "Hello", "Working Title", "More", "Words", "Blah", "path", "jelly")
  val prodOffices: List[String] = List("UK","US","AU")
  val priority: List[Int] = List(-2,-1,0,1,2)
  val sections: List[String] = List("Arts","Business","Cities","Environment","Film")
  val needsLegal: List[Flag] = List(Flag.NA, Flag.Complete, Flag.Required)
  val email: List[String] = List("testcake@testcake.com", "google@google.com", "facebook@facebook.com")
  val statuses: List[Status] = Status.values.toList
  val contentTypes: List[String] = List("article","gallery","live-blog","video","interactive","picture","video","audio")
  val state: List[ContentState] = List(PublishedState, TakenDownState, ScheduledState, EmbargoedState, DraftState)
  val users: List[User] = List(User("testcake@testcake.com", "test", "cake"), User("google@google.com", "goo", "gle"), User("facebook@facebook.com", "face", "book"))
  val commissioningDesks: List[String] = List("Hogwarts,The Burrow", "Privet Drive,London", "Hogsmeade")
  val path: List[String] = List("path_1", "path_2", "path_3")

  //select a date anywhere between now and the last 50 days
  def chooseDate: DateTime = DateTime.now().minusHours(random.nextInt(24*50))

  def chooseItem[A](list: List[A]): A = list(random.nextInt(list.size-1))

  def chooseList[A](list: List[A]): List[A] = list.take(random.nextInt(list.size-1))

  def chooseBool: Boolean = random.nextInt(2) % 2 == 0

  def opt[A](a: A): Option[A] = if(chooseBool) Some(a) else None

  def chooseId: String = random.nextDouble().toString

  def chooseInt: Int = random.nextInt()

  def chooseLong: Long = random.nextLong()

  def randomStub: Stub = generateRandomStub()

  //todo - genericise these methods over types
  def generateTestData(size: Int = 50, acc: List[Stub]=Nil): List[Stub] =
    if(size == 0) acc else generateTestData(size-1, randomStub::acc)

  def composerIdsFromStubs(stubList: List[Stub]) : List[String] = stubList.map(_.composerId.getOrElse(""))

  def stubWithSetDateTrashedAndStatus(newLastModified: DateTime, newStatus: String = "Writers",
    stubProbability: Int = 0, newEmbargoedIndefinitely: Boolean = false, newTrashed: Boolean = false): Stub = {
    val rs: Stub = randomStub
    val lsd: Option[DateTime] = rs.externalData.get.scheduledLaunchDate.orElse(None)

    rs.copy(
      lastModified = newLastModified,
      trashed = newTrashed,
      externalData = Some(rs.externalData.fold(ExternalData())(ed => ed.copy(
        status = Status.withName(newStatus),
        lastModified = Some(newLastModified),
        scheduledLaunchDate = lsd,
        embargoedIndefinitely= Some(newEmbargoedIndefinitely)))
      )
    )
  }

  def stubWithSetDateAndPublished(newLastModified: DateTime, newPublished: Boolean, newStatus: String = "Writers"): Stub = {
    val s: Stub = randomStub
    s.copy(
      lastModified = newLastModified,
      externalData = Some(s.externalData.fold(ExternalData())(_.copy(
        published = Some(newPublished),
        lastModified = Some(newLastModified),
        status = Status.withName(newStatus)))))
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
    val td: Boolean = chooseBool
    val pub = if (td) Some(false) else opt(chooseBool)
    Stub(
      title = chooseItem(text),
      section = chooseItem(sections),
      due = opt(chooseDate),
      assignee = opt(chooseItem(email)),
      assigneeEmail = opt(chooseItem(email)),
      composerId = Some(random.nextDouble().toString),
      contentType = chooseItem(contentTypes),
      priority = chooseItem(priority),
      needsLegal = chooseItem(needsLegal),
      note = opt(chooseItem(text)),
      prodOffice = chooseItem(prodOffices),
      createdAt = chooseDate,
      lastModified = chooseDate,
      trashed = chooseBool,
      commissioningDesks = opt(chooseItem(commissioningDesks)),
      externalData = Some(ExternalData(
        path = opt(chooseItem(path)),
        status = chooseItem(statuses),
        published = pub,
        takenDown = opt(td),
        revision = Some(10)
      ))
    )
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

  //todo - deprecate default stub/wc
  def defaultStub(title: String = "Title",
    composerId: Option[String] = None,
    prodOffice: String = "UK",
    priority: Int = 1,
    section: String = "Section",
    needsLegal:  Flag = Flag.NA,
    due: Option[DateTime] = None,
    contentType: String = "article",
    createdAt: DateTime = DateTime.now(),
    lastModified: DateTime = DateTime.now(),
    commissioningDesks: Option[String] = None) = {
    Stub(title = title,
      composerId = composerId,
      prodOffice = prodOffice,
      priority = priority,
      section = section,
      needsLegal = needsLegal,
      due = due,
      createdAt = createdAt,
      lastModified = lastModified,
      contentType = contentType,
      commissioningDesks = commissioningDesks,
      externalData = Some(ExternalData())
    )
  }

}
