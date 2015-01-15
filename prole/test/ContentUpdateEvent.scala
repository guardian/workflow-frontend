import models.{WorkflowContent, ContentUpdateEvent}
import org.joda.time.DateTime
import org.scalatest.{FunSuite, ShouldMatchers}
import lib.ResourcesHelper
import play.api.libs.json.{JsSuccess, Json}

class ContentUpdateEventModelSpec extends FunSuite with ShouldMatchers with ResourcesHelper{

  test("parse content update notification") {
    val resource = slurp("flex-content-update.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws, _) = Json.parse(resource).validate[ContentUpdateEvent]

    ws.composerId should equal("id")
    ws.path should equal (Some("music/2014/dec/08/nopennnnnn"))
    ws.headline should equal (Some("nn"))
    ws.trailText should equal (Some("ddsfsdsdf"))
    ws.wordCount should equal(16)

    (for {
      b <- ws.mainBlock
      e <- b.elements.headOption
    } yield e.elementType) should equal(Some("embed"))
  }

  test("parse content update notification from api") {
    val resource = slurp("flex-api-response.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws,_) =  ContentUpdateEvent.readFromApi(Json.parse(resource), WorkflowContent.default("5495b697e4b08b9165ec75ba"))

    ws.composerId should equal("5495b697e4b08b9165ec75ba")
    ws.`type` should equal ("article")
    ws.revision should equal (729L)
    ws.commentable should equal (true)
    ws.storyBundleId should equal (None)
    ws.user should equal(Some("scheduled launch"))
    ws.published should equal (true)
    ws.lastMajorRevisionDate should equal (Some(new DateTime("2014-12-30T11:30:11.172Z")))
    ws.publicationDate should equal (Some(new DateTime("2014-12-30T11:30:11.172Z")))
    ws.path should equal (Some("football/blog/2014/dec/30/us-soccer-2014-10-memorable-moments-klinsmann-altidore-world-cup"))
    ws.headline should equal (Some("headline"))
    ws.trailText should equal (Some("trailText"))
    ws.standfirst should equal (Some("standfirst"))

  }
}
