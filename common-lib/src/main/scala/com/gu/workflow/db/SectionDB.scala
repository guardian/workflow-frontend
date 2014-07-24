package com.gu.workflow.db

import com.gu.workflow.db.Schema._
import scala.slick.driver.PostgresDriver.simple._

object SectionDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def getAllSections = {
    DB.withTransaction { implicit session =>
      sections.list()
    }
  }

  //how to handle data duplication?
  def addSection(section: String) = {
    DB.withTransaction { implicit session =>
      sections += (0, section)
    }
  }

  def deleteSection(section: String) = {
    DB.withTransaction { implicit session =>
      sections.filter(_.section === section).delete
    }
  }

//  def getSections = {
//    DB.withTransaction { session =>
//
//    }
//  }
//
//  def addSection = {
//    DB.withTransaction { session =>
//      sections.insert
//    }
//  }

}
