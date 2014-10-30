package com.gu.workflow.db

import com.gu.workflow.db.Schema._
import models.{Section, Desk}
import play.api.libs.json.Json
import scala.slick.driver.PostgresDriver.simple._


case class SectionsInDeskMapping (deskId: Long, sectionIds: List[Long])

object SectionsInDeskMapping {
  implicit val sectionsinDeskJSONFormat = Json.format[SectionsInDeskMapping]
}

object DeskDB {

  import play.api.Play.current
  import play.api.db.slick.DB

  def deskList: List[Desk] = {
    DB.withTransaction { implicit session =>
      desks.list().map( {case (pk, name) => Desk(name, selected = false, pk)})
    }
  }

  def getSectionsInDesks: List[SectionsInDeskMapping] = {
    DB.withTransaction { implicit session =>
      desks.list().map({
        case (pk, name) => {
          SectionsInDeskMapping(pk,
            getSectionsWithRelation(Desk(name, selected = false, pk))
              .filter(section => section.selected)
              .map(section => section.id)
          )
        }
      })
    }
  }

  def getSectionsWithRelation(desk: Desk): List[Section] = {
    DB.withTransaction { implicit session =>

      val listOfSectionIdsInDesk = deskSectionMapping.filter(_.desk_id === desk.id).run

      sections.list().map({

        case (pk, name) if listOfSectionIdsInDesk.exists({

          case (`pk`, _) => true
          case _ => false

        }) => Section(name, selected = true, pk)

        case (pk, name) => Section(name, selected = false, pk)

      })

    }
  }

  def assignSectionsToDesk(deskId: Long, sectionIds: List[Long]) = {
    DB.withTransaction { implicit session =>

      // TODO: Better way of approaching this with 1 DB call?

      val mappingForDeskId = deskSectionMapping.filter(mapping => mapping.desk_id === deskId)

      // If in supplied sections list and not in database then ADD
      sectionIds.foreach(sectionId => {
        val mappingExists = mappingForDeskId.filter(mapping => mapping.desk_id === deskId && mapping.section_id === sectionId).exists.run

        if(!mappingExists) { // Add
          deskSectionMapping += (sectionId, deskId)
        }
      })

      // If in database and not in supplied sections list then REMOVE
      mappingForDeskId.run.map({
        case (mappingSectionId, mappingDeskId) => {

          val inMappingAndList = sectionIds.contains(mappingSectionId)

          if (!inMappingAndList) { // Remove
            mappingForDeskId.filter(mapping => mapping.section_id === mappingSectionId).delete
          }
        }
      })

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
