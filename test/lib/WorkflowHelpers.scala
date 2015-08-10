package test

import com.gu.workflow.db.CommonDB
import lib.{PostgresDB}
import models.Flag.Flag
import models._
import org.joda.time.DateTime
import scala.util.Random
import scala.util.Random._
import play.api.db.slick.DB

import play.api.Play.current

trait WorkflowHelpers {

  import scala.language.implicitConversions

  case class ContentItemWithCollaborators(contentItem: ContentItem, collaborators: List[User] = Nil) {
    def withCollaborators(updatedCollabs: User*) = this.copy(collaborators = updatedCollabs.toList)
  }

  implicit def hasCollaborators(c: ContentItem): ContentItemWithCollaborators =
    ContentItemWithCollaborators(c)

  def createContent(item: ContentItem): Option[ContentItem] = {
    val stubId = PostgresDB.createContent(item)
    stubId.fold(err => None, apiSucc => Some(ContentItem(item.stub.copy(Some(apiSucc.data)), item.wcOpt)))
  }

  // returns 'content' for chaining
  def addCollaborators(content: ContentItem, collaborators: List[User]) =
    DB.withSession { implicit session =>
      content.wcOpt.map( c =>
        CommonDB.addCollaborators(content.wcOpt, collaborators.toList, c.composerId)
      )
      content
    }
}
