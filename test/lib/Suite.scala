package test

import com.gu.workflow.test.Config
import com.typesafe.config.ConfigFactory
import models.ContentItem
import play.api.{ Configuration, GlobalSettings }
import play.api.test._
import play.api.libs.json._
import play.api.{Play, Application}

import org.scalatest._
import org.scalatestplus.play._
import org.scalatest.selenium._

import scala.language.implicitConversions
import org.openqa.selenium.htmlunit.HtmlUnitDriver
import org.openqa.selenium.WebDriver

import com.gu.workflow.test.CommonDBIntegrationSuite

trait WorkflowIntegrationSuite extends Suite with OneServerPerSuite with Matchers with ShouldMatchers with Http with WorkflowHelpers with CommonDBIntegrationSuite {
  implicit override lazy val app: FakeApplication = FakeApplication(
    additionalConfiguration = Config.appConfig.updated("db.default.url", Config.dbFullUrl + suiteName),
    withGlobal = Some(new GlobalSettings() {
      override def configuration: Configuration = {
        val testConfig = ConfigFactory.load("applicaion.ci.conf")
        Configuration(testConfig)
      }}))

  def getJs(path: String, expectedCode: Int = 200): JsValue = {
    val connection = GET(s"$host/$path")
    connection.responseCode should be (expectedCode)

    Json.parse(connection.body)
  }

  val host = Config.appConfig("host")
}
