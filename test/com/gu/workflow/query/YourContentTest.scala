package com.gu.workflow.query

import com.gu.workflow.test.DatabaseManager
import lib.PostgresDB
import com.gu.workflow.test.lib.TestData._
import models.{ContentItem, User}
import FilterTestOps._
import test._

import org.scalatest.{Matchers, FreeSpec}

class YourContentTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testEmail = "testcake@testcake.com"
  val testUser = User(testEmail, "Test", "Bunny")

  val assignedToField: FieldGetter[Option[String]] = _.stub.assigneeEmail

  def matchCollaboratorsTest(email: String) =
    fieldTest(_.stub.composerId,
              optTest[String](composerId => DatabaseManager.hasCollaborator(composerId, email)))

  def assignedToTest(pattern: String) = fieldTest(_.stub.assigneeEmail,
                                                  optTest[String](_ contains pattern))


  val testData = generateTestData(stubProbability = 0.0)

  val withCollaborators = testData.map(c => ContentItemWithCollaborators(c, generateRandomSizeCollaborators()))

  "YourContent query" - {
    "should correctly find assigned content" in withTestData(testData) { insertedData =>
      (WfQuery(assignedToEmail = List(testEmail))
         should selectSameResultsAs (FilterTest(assignedToTest(testEmail), insertedData)))
    }
    "should correctly find touched content" in withCollaboratorTestData(withCollaborators) { insertedData =>
      (WfQuery(touched = List(testEmail))
         should selectSameResultsAs (FilterTest(matchCollaboratorsTest(testEmail), insertedData)))
    }
  }
}
