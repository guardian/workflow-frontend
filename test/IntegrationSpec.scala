package test

import models.{ContentItem, Stub, WorkflowContent, Flag}
import lib.{PostgresDB}
import play.api.libs.json._

import org.scalatest.Inside
import play.api.libs.json.JsResult

object WorkflowHelpers {
  def contentItem(): ContentItem = {
    ContentItem(
      Stub(
        title = "Title",
        prodOffice = "UK",
        priority = 1,
        section = "Section",
        needsLegal = Flag.NotRequired
      ),
      None
    )
  }
}

class WorkflowSpec extends BaseSuite with Inside {
  s"$host/api/content" should "work" in {
    val item = WorkflowHelpers.contentItem
    PostgresDB.createContent(item)

    val connection = GET(s"$host/api/content")

    connection.responseCode should be (200)

    val result: JsValue = Json.parse(connection.body)
    (result \\ "title").headOption.get.toString should equal(""""Title"""")
  }
}
