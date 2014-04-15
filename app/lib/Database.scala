package lib

import models.WorkflowContent
import akka.agent.Agent
import scala.concurrent.ExecutionContext.Implicits.global


object Database {

  type Store = Map[String, WorkflowContent]

  val store: Agent[Store] = Agent(Map.empty)

}
