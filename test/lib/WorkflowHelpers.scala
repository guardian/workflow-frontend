package test

import lib.{PostgresDB}
import models.{ContentItem, Stub, WorkflowContent, Flag}


trait WorkflowHelpers {
  def createContent(item: ContentItem) = {
    PostgresDB.createContent(item)
    item
  }

  def contentItem(title: String = "Title"): ContentItem =
    ContentItem(
      Stub(
        title = title,
        prodOffice = "UK",
        priority = 1,
        section = "Section",
        needsLegal = Flag.NotRequired
      ),
      None
    )
}


