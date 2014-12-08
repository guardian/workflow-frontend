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
    } yield e.elementType).getOrElse("none") should equal("embed")
  }
}
