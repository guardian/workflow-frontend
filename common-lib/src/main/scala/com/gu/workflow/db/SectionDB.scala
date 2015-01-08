package com.gu.workflow.db

import com.gu.workflow.db.Schema._
import models.Section
import scala.slick.driver.PostgresDriver.simple._

object SectionDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def sectionList: List[Section] = {
    DB.withTransaction { implicit session =>
      sections.list.map( {case (pk, name) => Section(name, selected = false, pk)})
    }
  }

  def upsert(section: Section): Int = {
    DB.withTransaction { implicit session =>
      val sectionExists = sections.filter(_.section === section.name).exists.run
      if(!sectionExists) {
        sections += (0, section.name)
        1
      }
      else 0
    }
  }

  def remove(section: Section) = {
    DB.withTransaction { implicit session =>
      sections.filter(_.section === section.name).delete
    }
  }

}
