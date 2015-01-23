package com.gu.workflow.db

import com.gu.workflow.db.Schema._
import models.{Section, Desk}
import scala.slick.driver.PostgresDriver.simple._

object DeskDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def deskList: List[Desk] = {
    DB.withTransaction { implicit session =>
      desks.list.map( {case (pk, name) => Desk(name, selected = false, pk)})
    }
  }

  def upsert(desk: Desk): Int = {
    DB.withTransaction { implicit session =>
      val deskExists = desks.filter(_.desk === desk.name).exists.run
      if(!deskExists) {
        desks += (0, desk.name)
        1
      }
      else 0
    }
  }

  def remove(desk: Desk) = {
    DB.withTransaction { implicit session =>
      desks.filter(_.desk === desk.name).delete
    }
  }

}
