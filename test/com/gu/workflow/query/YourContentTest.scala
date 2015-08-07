package com.gu.workflow.query

import lib.PostgresDB
import models.{ContentItem, User}
import FilterTestOps._
import test._

import org.scalatest.{Matchers, FreeSpec}

class YourContentTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {

  val testEmail = "guardian@example.com"
  val testUser = User(testEmail, "Test", "Bunny")

  val assignedToField: FieldGetter[Option[String]] = _.stub.assigneeEmail

  def assignedToTest(pattern: String) = fieldTest(_.stub.assigneeEmail,
                                                  optTest[String](_ == pattern))

  val testData: List[ContentItemWithCollaborators] = List(
    contentItem(defaultStub(), Some(defaultWorkflow())),
    contentItem(defaultStub().copy(assigneeEmail = Some(testEmail)),
                Some(defaultWorkflow())),
    contentItem(defaultStub().copy(assigneeEmail = Some("nomatch@example.com")),
                Some(defaultWorkflow())).withCollaborators(testUser)
  )

  "YourContent query" - {
    "should find correctly assigned content" in withCollaboratorTestData(testData) { insertedData =>
      (WfQuery(assignedToEmail = List(testEmail))
         should selectSameResultsAs (FilterTest(assignedToTest(testEmail), insertedData)))
    }
  }
}
