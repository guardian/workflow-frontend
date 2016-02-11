package com.gu.workflow.admin

import com.gu.workflow.db.{SectionsInDeskMapping, DeskAndSection, SectionDeskMappingDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import org.scalatest.{Matchers, FreeSpec}
import com.gu.workflow.test.lib.TestData._

class SectionDeskMappingDBTest extends FreeSpec with CommonDBIntegrationSuite with Matchers {

  "Should be able to add a mapping from desk to section and retrieve by id" in {
    val desk = createDesk(generateDesk())
    val section = createSection(generateSection())
    SectionDeskMappingDB.insertSectionAndDeskMapping(desk.id, section.id) should equal (1)
  }

  "Should be able to retrieve desk and sections mappings by desk id" in {
    val desk = createDesk(generateDesk())
    val sectionOne = createSection(generateSection())
    val sectionTwo = createSection(generateSection())
    SectionDeskMappingDB.insertSectionAndDeskMapping(desk.id, sectionOne.id)
    SectionDeskMappingDB.insertSectionAndDeskMapping(desk.id, sectionTwo.id)

    SectionDeskMappingDB.getMappingByDeskId(desk.id) should equal (List(
      DeskAndSection(sectionOne.id, desk.id),
      DeskAndSection(sectionTwo.id, desk.id)
    ))
  }

  "Should return a list of sections with selected set for true where a mapping exists" in {
    val desk = createDesk(generateDesk())
    val sections = generateSections().map(createSection(_)).toList
    val sectionsWithMapping = sections.take(2)

    sectionsWithMapping.foreach { section =>
      SectionDeskMappingDB.insertSectionAndDeskMapping(desk.id, section.id)
    }

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsWithMapping.map(_.id))

    val selectedSections = SectionDeskMappingDB.showSelectedDesks(sectionsWithMapping.map(_.id), sections)
    val (selected, notSelected) = selectedSections.partition(s => sectionsWithMapping.map(_.id).contains(s.id))
    selected.map(_.selected) should equal (List(true, true))
    notSelected.map(_.selected) should equal (List(false, false, false))

  }

  "Should update desk and section mapping" in {
    val desk = createDesk(generateDesk())
    val sectionsOneIds = generateSections().map(createSection(_)).map(_.id).toList
    val sectionsTwoIds = generateSections().map(createSection(_)).map(_.id).toList

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsOneIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsOneIds)

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsTwoIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsTwoIds)
  }

  "Should return all section and desk mappings" in {
    val desks = generateDesks().map(createDesk(_))
    val sections = generateSections().map(createSection(_)).toList

    desks.map(desk => SectionDeskMappingDB.assignSectionsToDesk(desk.id, sections.map(_.id)))

    SectionDeskMappingDB.getSectionsInDesks(sections) should equal (desks.map(d => SectionsInDeskMapping(d.id,sections.map(_.id))))
  }

}
