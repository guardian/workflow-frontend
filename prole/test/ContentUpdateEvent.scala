import models.ContentUpdateEvent
import org.joda.time.DateTime
import org.scalatest.{FunSuite, ShouldMatchers}
import lib.ResourcesHelper
import play.api.libs.json.{JsSuccess, Json}

class ContentUpdateEventModelSpec extends FunSuite with ShouldMatchers with ResourcesHelper{

  test("parse content update notification") {
    val resource = slurp("flex-content-update.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws, _) = Json.parse(resource).validate[ContentUpdateEvent]

    ws.composerId should equal("id")

    (for {
      b <- ws.mainBlock
      e <- b.elements.headOption
    } yield e.elementType) should equal(Some("embed"))
  }

  test("parse content update notification from api") {
    val resource = slurp("flex-api-response.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws,_) =  ContentUpdateEvent.readFromApi(Json.parse(resource))

    ws.composerId should equal("5495b697e4b08b9165ec75ba")
    ws.user should equal(Some("scheduled launch"))
    ws.published should equal (true)
    ws.identifiers should equal (Map("path" -> "football/blog/2014/dec/30/us-soccer-2014-10-memorable-moments-klinsmann-altidore-world-cup","pageId" ->  "2213457"))
    ws.fields should equal (Map( "trailText" -> "trailText", "headline" -> "headline", "linkText" -> "linkText", "standfirst" -> "standfirst", "slug" -> "slug", "byline" -> "byline"))

  }
}
