package lib

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import models.{Stub, Section, WorkflowContent}
import akka.agent.Agent
import play.api.libs.ws._
import java.util.UUID
import play.api.libs.json.JsArray
import play.api.mvc.Action


object ContentDatabase {

  type Store = Map[UUID, WorkflowContent]

  val store: Agent[Store] = Agent(Map.empty)

  def update(contentId: UUID, f: WorkflowContent => WorkflowContent): Future[Option[WorkflowContent]] = {
    val updatedStore = store.alter { items =>
      val updatedItem = items.get(contentId).map(f)
      updatedItem.map(items.updated(contentId, _)).getOrElse(items)
    }
    updatedStore.map(_.get(contentId))
  }

  def doesNotContainPath(path: String): Future[Boolean] = {
    store.future().map { items =>
      items.values.toList.filter(_.path==Some(path)).isEmpty
    }
  }
}

object SectionDatabase {
  val store: Agent[Set[Section]] = Agent(Set())

  for(apiSections <- loadSectionsFromApi) store.alter(apiSections)

  def upsert(section: Section): Future[Set[Section]] = store.alter(_ + section)
  def remove(section: Section): Future[Set[Section]] = store.alter(_ - section)

  def sectionList: Future[List[Section]] = Future { store.get().toList.sortBy(_.name) }

  // TODO sw 02/05/2014 this a dev bootstrap, remove in favor of persisted list once weve got a persistence mechanism
  private def loadSectionsFromApi = {
    val sectionUrl = "http://content.guardianapis.com/sections.json"
    WS.url(sectionUrl).get().map { resp =>
      val titles = resp.json \ "response" \ "results" match {
        case JsArray(sections) => sections.map{ s => (s \ "webTitle").as[String] }
        case _ => Nil
      }
      titles.map(Section(_)).toSet
    }

  }

}

object StubDatabase {

  import play.api.libs.json.Json

  def getAll: Future[List[Stub]] =
    AWSWorkflowBucket.readStubsFile.map(AWSWorkflowBucket.parseStubsJson)

  def create(stub: Stub): Future[Unit] = for {
    stubs <- getAll
    newStubs = stub :: stubs
    json = Json.toJson(newStubs)
    _ <- AWSWorkflowBucket.putJson(json)
  } yield ()

  def update(stubId: String, composerId: String): Future[Unit] = for {
      stubs <- getAll
      updatedStubs = stubs.map( s => if(s.id==stubId) s.copy(composerId=Some(composerId)) else s)
      json = Json.toJson(updatedStubs)
      _ <- AWSWorkflowBucket.putJson(json)
  } yield ()
}
