package com.gu.workflow.admin

import com.gu.workflow.db.{SectionsInDeskMapping, DeskAndSection, SectionDeskMappingDB}
import com.gu.workflow.test.CommonDBIntegrationSuite
import org.scalatest.{Matchers, FreeSpec}
import com.gu.workflow.test.lib.TestData._

class SectionDeskMappingDBTest extends FreeSpec with CommonDBIntegrationSuite with Matchers {

  "Should be able to insert a desk and section mapping" in {
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

  "Should return a list of desk and sections relations when searched by desk id" in {
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

  "assignSectionsToDesk a list of sections to a desk should result in desk and sections being mapped" in {
    val desk = createDesk(generateDesk())
    val sectionsOneIds = generateSections().map(createSection(_)).map(_.id).toList
    val sectionsTwoIds = generateSections().map(createSection(_)).map(_.id).toList

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsOneIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsOneIds)

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsTwoIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsTwoIds)
  }

  "assignSectionsToDesk a list of sections to a desk should unmap existing mappings and create new mappings" in {
    val desk = createDesk(generateDesk())
    val sectionsOneIds = generateSections().map(createSection(_)).map(_.id).toList
    val sectionsTwoIds = generateSections().map(createSection(_)).map(_.id).toList

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsOneIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsOneIds)

    SectionDeskMappingDB.assignSectionsToDesk(desk.id, sectionsTwoIds)

    SectionDeskMappingDB.getMappingByDeskId(desk.id).map(_.sectionId) should equal (sectionsTwoIds)
  }


  "getAllSectionDeskMapping should return a list of desks and sections" in {
    val desks = generateDesks().map(createDesk(_))
    val sections = generateSections().map(createSection(_)).toList

    val desksAndSections = sections.flatMap(s => desks.map(d => DeskAndSection(s.id, d.id)))

    desks.map(desk => SectionDeskMappingDB.assignSectionsToDesk(desk.id, sections.map(_.id)))

    SectionDeskMappingDB.getAllSectionDeskMapping should contain theSameElementsAs (desksAndSections)
  }

  "getSectionsInDesks should serialise desks and sections into sections in sections in desk mappings" in {
    val deskIdOne = 1L
    val deskIdTwo = 2L
    val sectionIdOne = 1L
    val sectionIdTwo = 2L
    val sectionIdThree = 3L

    val desksAndSections = List(DeskAndSection(sectionIdOne, deskIdOne),
                                DeskAndSection(sectionIdTwo, deskIdOne),
                                DeskAndSection(sectionIdThree, deskIdTwo))

    val sectionAndDesksMapping = List(SectionsInDeskMapping(deskIdOne, List(sectionIdOne, sectionIdTwo)),
                                      SectionsInDeskMapping(deskIdTwo, List(sectionIdThree)))

    SectionDeskMappingDB.deskAndSectionsToMapping(desksAndSections) should contain theSameElementsAs (sectionAndDesksMapping)
  }


}
