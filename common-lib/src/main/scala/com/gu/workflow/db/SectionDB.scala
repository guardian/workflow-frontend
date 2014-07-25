package com.gu.workflow.db

import com.gu.workflow.db.Schema._
import models.Section
import scala.slick.driver.PostgresDriver.simple._

object SectionDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def sectionList: List[Section] = {
    DB.withTransaction { implicit session =>
      sections.list().map( {case (pk, name) => Section(name)})
    }
  }

  //how to handle data duplication?
  def upsert(section: Section) = {
    DB.withTransaction { implicit session =>
      sections += (0, section.name)
    }
  }

  def remove(section: Section) = {
    DB.withTransaction { implicit session =>
      sections.filter(_.section === section.name).delete
    }
  }

}
