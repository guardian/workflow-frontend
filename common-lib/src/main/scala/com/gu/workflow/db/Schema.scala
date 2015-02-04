package com.gu.workflow.db

import models.{Status, Flag}
import models.Flag._
import org.joda.time.DateTime
import scala.slick.driver.PostgresDriver.simple._
import scala.slick.lifted.{Query, TableQuery}
import com.github.tototoshi.slick.PostgresJodaSupport._
import scala.slick.collection.heterogenous._
import scala.slick.model.Column
import syntax._


object Schema {

  type StubRow = (
    Long,               // pk
    String,             // working_title
    String,             // section
    Option[DateTime],   // due
    Option[String],     // assign_to
    Option[String],     // assign_to_email
    Option[String],     // composer_id
    Option[String],     // content_type
    Int,                // priority
    Flag,               // needs_legal
    Option[String],     // note
    String,             // prod_office,
    DateTime            // createdAt
  )

  case class DBStub(tag: Tag) extends Table[StubRow](tag, "stub") {
    def pk            = column [Long]             ("pk", O.PrimaryKey, O.AutoInc)
    def workingTitle  = column [String]           ("working_title")
    def section       = column [String]           ("section")
    def due           = column [Option[DateTime]] ("due")
    def assignee      = column [Option[String]]   ("assign_to")
    def assigneeEmail = column [Option[String]]   ("assign_to_email")
    def composerId    = column [Option[String]]   ("composer_id")
    def contentType   = column [Option[String]]   ("content_type")
    def priority      = column [Int]              ("priority")
    def needsLegal    = column [Flag]             ("needs_legal")
    def note          = column [Option[String]]   ("note")
    def prodOffice    = column [String]           ("prod_office")
    def createdAt     = column [DateTime]         ("created_at")
    def * = (pk, workingTitle, section, due, assignee, assigneeEmail, composerId, contentType, priority, needsLegal, note, prodOffice, createdAt)
  }

  type ContentRow =
      String           :: // composer_id
      Option[String]   :: // path
      DateTime         :: // last_modified
      Option[String]   :: // last_modified_by
      String           :: // status
      String           :: // content_type
      Boolean          :: // commentable
      Option[String]   :: // headline
      Option[String]   :: // standfirst
      Option[String]   :: // trailtext
      Option[String]   :: // mainMedia
      Option[String]   :: // mainMediaUrl
      Option[String]   :: // mainMediaCaption
      Option[String]   :: // mainMediaAltText
      Option[String]   :: // trailImageUrl
      Boolean          :: // published
      Option[DateTime] :: // timePublished
      Option[Long]     :: // revision
      Option[String]   :: // storyBundleId
      Boolean          :: // activeInInCopy
      Boolean          :: // takenDown
      Option[DateTime] :: // timeTakenDown
      Int              :: // wordCount
      Option[DateTime] :: // embargoedUntil
      Boolean          :: // embargoedIndefinitely
      Option[DateTime] :: // scheduledLaunchDate
      HNil

  type OptionContentRow =
    Option[String]           :: // composer_id
    Option[String]           :: // path
    Option[DateTime]         :: // last_modified
    Option[String]           :: // last_modified_by
    Option[String]           :: // status
    Option[String]           :: // content_type
    Option[Boolean]          :: // commentable
    Option[String]           :: // headline
    Option[String]           :: // standfirst
    Option[String]           :: // trailtext
    Option[String]           :: // mainMedia
    Option[String]           :: // mainMediaUrl
    Option[String]           :: // mainMediaCaption
    Option[String]           :: // mainMediaAltText
    Option[String]           :: // trailImageUrl
    Option[Boolean]          :: // published
    Option[DateTime]         :: // timePublished
    Option[Long]             :: // revision
    Option[String]           :: // storyBundleId
    Option[Boolean]          :: // activeInInCopy
    Option[Boolean]          :: // takenDown
    Option[DateTime]         :: // timeTakenDown
    Option[Int]              :: // wordCount
    Option[DateTime]         :: // embargoedUntil
    Option[Boolean]          :: // embargoedIndefinitely
    Option[DateTime]         :: // scheduledLaunchDate
    HNil

  case class DBContent(tag: Tag) extends Table[ContentRow](tag, "content") {
    def composerId            = column [String]            ("composer_id", O.PrimaryKey)
    def path                  = column [Option[String]]    ("path")
    def lastModified          = column [DateTime]          ("last_modified")
    def lastModifiedBy        = column [Option[String]]    ("last_modified_by")
    def status                = column [String]            ("status")
    def contentType           = column [String]            ("content_type")
    def commentable           = column [Boolean]           ("commentable")
    def headline              = column [Option[String]]    ("headline")
    def standfirst            = column [Option[String]]    ("standfirst")
    def trailtext             = column [Option[String]]    ("trailtext")
    def mainMedia             = column [Option[String]]    ("mainmedia")
    def mainMediaUrl          = column [Option[String]]    ("mainmedia_url")
    def mainMediaCaption      = column [Option[String]]    ("mainmedia_caption")
    def mainMediaAltText      = column [Option[String]]    ("mainmedia_alttext")
    def trailImageUrl         = column [Option[String]]    ("trailimage_url")
    def published             = column [Boolean]           ("published")
    def timePublished         = column [Option[DateTime]]  ("time_published")
    def takenDown             = column [Boolean]           ("takendown")
    def timeTakenDown         = column [Option[DateTime]]  ("time_takendown")
    def revision              = column [Option[Long]]      ("revision")
    def storyBundleId         = column [Option[String]]    ("storybundleid")
    def activeInInCopy        = column [Boolean]           ("activeinincopy")
    def wordCount             = column [Int]               ("wordcount")
    def embargoedUntil        = column [Option[DateTime]]  ("embargoed_until")
    def embargoedIndefinitely = column [Boolean]           ("embargoed_indefinitely")
    def scheduledLaunchDate   = column [Option[DateTime]]  ("scheduled_launch_date")
    def * = composerId            ::
            path                  ::
            lastModified          ::
            lastModifiedBy        ::
            status                ::
            contentType           ::
            commentable           ::
            headline              ::
            standfirst            ::
            trailtext             ::
            mainMedia             ::
            mainMediaUrl          ::
            mainMediaCaption      ::
            mainMediaAltText      ::
            trailImageUrl         ::
            published             ::
            timePublished         ::
            revision              ::
            storyBundleId         ::
            activeInInCopy        ::
            takenDown             ::
            timeTakenDown         ::
            wordCount             ::
            embargoedUntil        ::
            embargoedIndefinitely ::
            scheduledLaunchDate   ::
            HNil

    /*This is so content table can return none for the content query where composerId is not set */

    def ? = composerId.?            ::
            path                    ::
            lastModified.?          ::
            lastModifiedBy          ::
            status.?                ::
            contentType.?           ::
            commentable.?           ::
            headline                ::
            standfirst              ::
            trailtext               ::
            mainMedia               ::
            mainMediaUrl            ::
            mainMediaCaption        ::
            mainMediaAltText        ::
            trailImageUrl           ::
            published.?             ::
            timePublished           ::
            revision                ::
            storyBundleId           ::
            activeInInCopy.?        ::
            takenDown.?             ::
            timeTakenDown           ::
            wordCount.?             ::
            embargoedUntil          ::
            embargoedIndefinitely.? ::
            scheduledLaunchDate     ::
            HNil
  }

  type SectionRow = (
      Long,   //pk
      String //section
    )

  type deskSectionMappingRow = (
      Long, // Section pk
      Long  // Desk pk
    )

  case class DBSection(tag: Tag) extends Table[SectionRow](tag, "section") {
    def pk      = column [Long]     ("pk", O.PrimaryKey, O.AutoInc)
    def section = column [String]   ("section")
    def * = (pk, section)
  }

  case class DBDesk(tag: Tag) extends Table[SectionRow](tag, "desk") {
    def pk      = column [Long]     ("pk", O.PrimaryKey, O.AutoInc)
    def desk = column [String]   ("desk")
    def * = (pk, desk)
  }

  case class DBDeskSectionMapping(tag: Tag) extends Table[deskSectionMappingRow](tag, "section_desk_mapping") {
    def desk_id = column [Long] ("desk_id")
    def section_id = column [Long] ("section_id")
    def * = (section_id, desk_id)
  }

  type ArchiveRow = (
    Option[Long],      // pk
    Long,              // stub_id
    Option[String],    // composer_id
    Boolean,           // was_deleted
    String,            // working_title
    String,            // section
    Option[String],    // content_type
    String,            // prod_office,
    DateTime,          // created_at
    DateTime,          // last_modified
    String,            // status
    Option[String],    // headline
    Option[String],    // path
    Boolean,           // published
    Option[DateTime],  // timePublished
    Option[Long],      // revision
    Option[String],    // storyBundleId
    Boolean,           // activeInInCopy
    Boolean,           // takenDown
    Option[DateTime],  // timeTakenDown
    DateTime           // archivedAt
  )

  case class DBArchive(tag: Tag) extends Table[ArchiveRow](tag, "archive") {
    def pk = column [Long] ("pk", O.PrimaryKey, O.AutoInc)
    def stubId = column [Long] ("stub_id")
    def composerId = column [Option[String]] ("composer_id")
    def wasDeleted = column [Boolean] ("was_deleted")
    def workingTitle = column [String] ("working_title")
    def section = column [String] ("section")
    def contentType = column [Option[String]] ("content_type")
    def prodOffice = column [String] ("prod_office")
    def createdAt = column [DateTime] ("created_at")

    def lastModified = column [DateTime] ("last_modified")
    def status = column [String] ("status")
    def headline = column [Option[String]] ("headline")
    def path = column [Option[String]] ("path")
    def published = column [Boolean] ("published")
    def timePublished = column [Option[DateTime]] ("time_published")
    def revision = column [Option[Long]] ("revision")
    def storybundleid = column [Option[String]] ("storybundleid")
    def activeinincopy = column [Boolean] ("activeinincopy")
    def takendown = column [Boolean] ("takendown")
    def timeTakendown = column [Option[DateTime]] ("time_takendown")

    def archivedAt = column[DateTime]("archived_at")

    def * = (
      pk.?, stubId, composerId, wasDeleted,
      workingTitle, section, contentType, prodOffice, createdAt,
      lastModified, status, headline, path, published, timePublished, revision,
      storybundleid, activeinincopy, takendown, timeTakendown, archivedAt
    )
  }

  type StubQuery = Query[DBStub, StubRow, Seq]
  type ContentQuery = Query[DBContent, ContentRow, Seq]
  type SectionQuery = Query[DBSection, SectionRow, Seq]
  type DeskQuery = Query[DBDesk, SectionRow, Seq]
  type DeskSectionMappingQuery = Query[DBDeskSectionMapping, deskSectionMappingRow, Seq]
  type ArchiveQuery = Query[DBArchive, ArchiveRow, Seq]

  val stubs: StubQuery = TableQuery(DBStub)
  val content: ContentQuery = TableQuery(DBContent)

  val sections: SectionQuery = TableQuery(DBSection)

  val desks: DeskQuery = TableQuery(DBDesk)

  val deskSectionMapping: DeskSectionMappingQuery = TableQuery(DBDeskSectionMapping)

  val archive: ArchiveQuery = TableQuery(DBArchive)

  implicit lazy val flagColumnType = MappedColumnType.base[Flag, String] (
    f => f.toString,
    s => Flag.withName(s)
  )

}
