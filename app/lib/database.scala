package lib

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import models.{Section, WorkflowContent}
import akka.agent.Agent
import java.util.UUID


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

  val store: Agent[Set[Section]] = Agent(Set(
    Section("Technology"),
    Section("Sport"),
    Section("Global"),
    Section("Books")
  ))

  def upsert(section: Section): Future[Set[Section]] = store.alter(_ + section)
  def remove(section: Section): Future[Set[Section]] = store.alter(_ - section)

  def sectionList: Future[List[Section]] = Future { store.get().toList.sortBy(_.name) }

}
