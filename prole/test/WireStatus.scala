import models.WireStatus
import org.joda.time.DateTime
import org.scalatest.{FunSuite, ShouldMatchers}
import lib.ResourcesHelper
import play.api.libs.json.{JsSuccess, Json}

class WireStatusModelSpec extends FunSuite with ShouldMatchers with ResourcesHelper{

  test("parse flex notification 1") {
    val resource = slurp("flex-notification1.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws, _) = Json.parse(resource).validate[WireStatus]
    ws.composerId should equal("546c965bb0c64447ac22fa62")
    ws.path should equal (None)
    ws.`type` should equal ("article")
    ws.whatChanged should equal ("setting")
    ws.user should equal (Some("Robert Kenny"))
    ws.lastModified should equal (new DateTime("2014-11-19T15:05:18.002Z"))
    ws.tagSections should equal (Nil)
    ws.commentable should equal (false)
    ws.published should equal (false)
    ws.lastMajorRevisionDate should equal (None)
    ws.revision should equal (4)
  }

  test("parse flex notification 2") {
    val resource = slurp("flex-notification2.json").getOrElse(throw new RuntimeException("could not find test resource"))
    val JsSuccess(ws, _) = Json.parse(resource).validate[WireStatus]
    ws.composerId should equal("546c965bb0c64447ac22fa62")
    ws.path should equal (None)
    ws.`type` should equal ("article")
    ws.whatChanged should equal ("published")
    ws.user should equal (None)
    ws.lastModified should equal (new DateTime("2014-11-19T15:05:18.002Z"))
    ws.tagSections should equal (Nil)
    ws.commentable should equal (false)
    ws.published should equal (true)
    ws.lastMajorRevisionDate should equal (Some(new DateTime("2014-07-02T14:18:58.687Z")))
    ws.publicationDate should equal (Some(new DateTime("2014-07-02T14:18:58.687Z")))
    ws.revision should equal (3)
  }
}
