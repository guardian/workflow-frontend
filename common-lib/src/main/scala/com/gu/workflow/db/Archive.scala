package com.gu.workflow.db

import play.api.Logger
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._
import com.gu.workflow.syntax._
import models._
import com.gu.workflow.query._
import com.gu.workflow.db.Schema._

object Archive {
  import play.api.Play.current
  import play.api.db.slick.DB

  def getArchiveContentForStubId(id: Long): Option[ArchiveContent]  = DB.withTransaction { implicit session =>
    archive.filter(_.stubId === id).firstOption.map(ArchiveContent.fromArchiveRow(_))
  }

  def getArchiveContentForComposerId(id: String): Option[ArchiveContent]  = DB.withTransaction { implicit session =>
    archive.filter(_.composerId === id).firstOption.map(ArchiveContent.fromArchiveRow(_))
  }
}

