package lib

import models.WorkflowContent
import akka.agent.Agent
import play.api.libs.concurrent.Execution.Implicits._

object Database {

  type Store = Map[String, WorkflowContent]

  val store: Agent[Store] = Agent(Map.empty)

}
