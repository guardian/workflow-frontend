package test

import models.ContentItem
import play.api.test._
import play.api.libs.json._
import play.api.{Play, Application}

import org.scalatest._
import org.scalatestplus.play._
import org.scalatest.selenium._

import scala.language.implicitConversions
import org.openqa.selenium.htmlunit.HtmlUnitDriver
import org.openqa.selenium.WebDriver

trait WorkflowIntegrationSuite extends Suite with OneServerPerSuite with BeforeAndAfterAll with BeforeAndAfterEach with Matchers with ShouldMatchers with Http with WorkflowHelpers {
  implicit override lazy val app: FakeApplication = FakeApplication(
    additionalConfiguration = Config.appConfig)

  def getJs(path: String, expectedCode: Int = 200): JsValue = {
    val connection = GET(s"$host/$path")
    connection.responseCode should be (expectedCode)

    Json.parse(connection.body)
  }

  def withTestData(testData: List[ContentItem])(f: (List[ContentItem]) => Unit) =
    f(testData.map(createContent(_)).flatten)

  def withCollaboratorTestData(testData: List[ContentItemWithCollaborators])
                              (f: (List[ContentItem]) => Unit) = {
    val content = testData.map(_.contentItem)
    val dataInserted = content.map(createContent(_)).flatten
    testData.foreach(item => addCollaborators(item.contentItem, item.collaborators))
    f(dataInserted)
  }

  override def beforeAll() {
    val props = System.getProperties();
    props.setProperty("config.resource", "application.ci.conf");

    DatabaseManager.destroy
    DatabaseManager.create
  }

  override def afterAll() {
    if(Config.dropDB) DatabaseManager.destroy
    else println("Not dropping database")
  }

  override def beforeEach() {

    //todo - fix the clear content
    DatabaseManager.clearContent

//    DatabaseManager.destroy
//    DatabaseManager.create
  }

  val host = Config.appConfig("host")
}
