package test

import play.api.test._
import org.scalatest._
import org.scalatestplus.play._
import org.scalatest.selenium._

import play.api.{Play, Application}
import scala.language.implicitConversions
import org.openqa.selenium.htmlunit.HtmlUnitDriver
import org.openqa.selenium.WebDriver

trait BaseSuite extends FlatSpec with OneServerPerSuite with BeforeAndAfterAll with Matchers with ShouldMatchers with Http {
  implicit override lazy val app: FakeApplication = FakeApplication(
    additionalConfiguration = Config.appConfig)

  override def beforeAll() {
    val props = System.getProperties();
    props.setProperty("config.resource", "application.ci.conf");

    DatabaseManager.create
  }

  override def afterAll() {
    DatabaseManager.destroy
  }

  val host = Config.appConfig("host")
}
