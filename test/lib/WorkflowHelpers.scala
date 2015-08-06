package test

import lib.{PostgresDB}
import models.Flag.Flag
import models._
import org.joda.time.DateTime
import scala.util.Random
import scala.util.Random._


trait WorkflowHelpers {
  def createContent(item: ContentItem): Option[ContentItem] = {
    val stubId = PostgresDB.createContent(item)
    stubId.fold(err => None, apiSucc => Some(ContentItem(item.stub.copy(Some(apiSucc.data)), item.wcOpt)))
  }

}


