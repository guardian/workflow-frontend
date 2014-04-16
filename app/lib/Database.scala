package lib

import models.WorkflowContent
import akka.agent.Agent
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object Database {

  type Store = Map[String, WorkflowContent]

  val store: Agent[Store] = Agent(Map.empty)

  def update(contentId: String, f: WorkflowContent => WorkflowContent): Future[Option[WorkflowContent]] = {
    val updatedStore = store.alter { items =>
      val updatedItem = items.get(contentId).map(f)
      updatedItem.map(items.updated(contentId, _)).getOrElse(items)

    }
    updatedStore.map(_.get(contentId))
  }
}
