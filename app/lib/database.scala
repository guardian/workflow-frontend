package lib

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import models.{Desk, WorkflowContent}
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

object DeskDatabase {

  val store: Agent[Set[Desk]] = Agent(Set(
    Desk("Technology"),
    Desk("Sport"),
    Desk("Global"),
    Desk("Books")
  ))

  def upsert(desk: Desk): Future[Set[Desk]] = store.alter(_ + desk)
  def remove(desk: Desk): Future[Set[Desk]] = store.alter(_ - desk)

  def deskList: Future[List[Desk]] = Future { store.get().toList.sortBy(_.name) }

}
