package lib

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import akka.agent.Agent
import models.Status


object StatusDatabase {

  val store: Agent[List[Status]] = Agent(List(
    Status.Stub,
    Status("Writers"),
    Status("Desk"),
    Status("Subs"),
    Status("Production Editor"),
    Status("Revise"),
    Status("Final"),
    Status("Hold")
  ))

  def statuses = store.future()

  def find(name: String) = store.get().find(_.name.toUpperCase == name.toUpperCase)

}
