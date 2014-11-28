import models.LifecycleEvent
import org.joda.time.DateTime
import org.scalatest.{FunSuite, ShouldMatchers}
import lib.ResourcesHelper
import play.api.libs.json.{JsSuccess, Json}

class LifecycleEventModelSpec extends FunSuite with ShouldMatchers with ResourcesHelper{
  test("parse lifecycle notification") {
    val resource = slurp("flex-lifecycle-delete.json").getOrElse(
      throw new RuntimeException("could not find test resource"))

    val JsSuccess(e, _) = Json.parse(resource).validate[LifecycleEvent]

    e.composerId should equal("546cb758b0c69faf18e3fd00")
    e.managedByComposer should equal(false)
    e.event should equal("delete")
    e.eventTime should equal(new DateTime("2014-11-19T15:29:43.234Z"))
  }
}
