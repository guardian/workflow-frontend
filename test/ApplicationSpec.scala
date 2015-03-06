import org.scalatest.BeforeAndAfterAll
import org.openqa.selenium.WebDriver
import org.openqa.selenium.htmlunit.HtmlUnitDriver
import org.scalatest.FlatSpec
import play.api.test.TestServer
import org.scalatest.Matchers
import play.api.test.Helpers
import org.scalatest.selenium.WebBrowser
import play.api.test.FakeApplication
import play.api.GlobalSettings
import play.api.test.Helpers._

trait PlayBrowserSpec extends FlatSpec with BeforeAndAfterAll with Matchers with WebBrowser{

  implicit val webDriver: WebDriver = new HtmlUnitDriver

  val host = s"http://localhost:${Helpers.testServerPort}"
  var app: FakeApplication = _
  var server: TestServer = _

  override def beforeAll() {
    val props = System.getProperties();
    props.setProperty("config.resource", "application.local.conf");

    app = FakeApplication()

    println(app.configuration.getString("db.default.url"))

    server = TestServer(port = Helpers.testServerPort)
    server.start
  }

  override def afterAll() {
    server.stop
    quit
  }
}

class WorkflowSpec extends PlayBrowserSpec {

  "The home page" should "have the correct title" in {
    go to (host + "/")
    pageTitle should be("Workflow")
  }
}
