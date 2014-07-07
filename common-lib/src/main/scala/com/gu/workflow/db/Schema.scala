package com.gu.workflow.db

import models.Flag
import models.Flag.Flag
import org.joda.time.DateTime
import scala.slick.driver.PostgresDriver.simple._
import scala.slick.lifted.{Query, TableQuery}
import com.github.tototoshi.slick.PostgresJodaSupport._


object Schema {

  type StubRow = (
    Long,             // pk
    String,           // working_title
    String,           // section
    Option[DateTime], // due
    Option[String],   // assign_to
    Option[String],   // composer_id
    Option[String],   // content_type
    Flag              // needs_legal
  )

  case class DBStub(tag: Tag) extends Table[StubRow](tag, "stub") {
    def pk           = column [Long]             ("pk", O.PrimaryKey, O.AutoInc)
    def workingTitle = column [String]           ("working_title")
    def section      = column [String]           ("section")
    def due          = column [Option[DateTime]] ("due")
    def assignee     = column [Option[String]]   ("assign_to")
    def composerId   = column [Option[String]]   ("composer_id")
    def contentType  = column [Option[String]]   ("content_type")
    def needsLegal   = column [Flag]             ("needs_legal")
    def * = (pk, workingTitle, section, due, assignee, composerId, contentType, needsLegal)
  }

  type ContentRow = (
      String,         // composer_id
      Option[String], // path
      DateTime,       // last_modified
      Option[String], // last_modified_by
      String,         // status
      String,         // content_type
      Boolean,        // commentable
      Option[String], // headline
      Boolean,         // published
      Option[DateTime] // timePublished
    )

  case class DBContent(tag: Tag) extends Table[ContentRow](tag, "content") {
    def composerId     = column [String]            ("composer_id", O.PrimaryKey)
    def path           = column [Option[String]]    ("path")
    def lastModified   = column [DateTime]          ("last_modified")
    def lastModifiedBy = column [Option[String]]    ("last_modified_by")
    def status         = column [String]            ("status")
    def contentType    = column [String]            ("content_type")
    def commentable    = column [Boolean]           ("commentable")
    def headline       = column [Option[String]]    ("headline")
    def published      = column [Boolean]           ("published")
    def timePublished  = column [Option[DateTime]]  ("time_published")
    def * = (composerId, path, lastModified, lastModifiedBy, status, contentType, commentable, headline, published, timePublished)
  }

  type StubQuery = Query[DBStub, StubRow]
  type ContentQuery = Query[DBContent, ContentRow]

  val stubs: StubQuery = TableQuery(DBStub)
  val content: ContentQuery = TableQuery(DBContent)

  implicit def flagColumnType = MappedColumnType.base[Flag, String] (
    f => f.toString,
    s => Flag.withName(s)
  )
}
