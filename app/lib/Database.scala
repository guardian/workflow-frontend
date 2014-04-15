package lib

import models.WorkflowContent
import akka.agent.Agent


object Database {

  type Store = Map[String, WorkflowContent]

  val store: Agent[Store] = Agent(Map.empty)

}
