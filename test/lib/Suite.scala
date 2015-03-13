package test

import play.api.test._
import play.api.libs.json._
import play.api.{Play, Application}

import org.scalatest._
import org.scalatestplus.play._
import org.scalatest.selenium._

import scala.language.implicitConversions
import org.openqa.selenium.htmlunit.HtmlUnitDriver
import org.openqa.selenium.WebDriver

trait WorkflowIntegrationSuite extends FlatSpec with OneServerPerSuite with BeforeAndAfterAll with BeforeAndAfterEach with Matchers with ShouldMatchers with Http with WorkflowHelpers {
  implicit override lazy val app: FakeApplication = FakeApplication(
    additionalConfiguration = Config.appConfig)

  def getJs(path: String, expectedCode: Int = 200): JsValue = {
    val connection = GET(s"$host/$path")
    connection.responseCode should be (expectedCode)

    Json.parse(connection.body)
  }

  override def beforeAll() {
    val props = System.getProperties();
    props.setProperty("config.resource", "application.ci.conf");

    DatabaseManager.destroy
    DatabaseManager.create
  }

  override def afterAll() {
    DatabaseManager.destroy
  }

  override def beforeEach() {
    DatabaseManager.clearContent
  }

  val host = Config.appConfig("host")
}
