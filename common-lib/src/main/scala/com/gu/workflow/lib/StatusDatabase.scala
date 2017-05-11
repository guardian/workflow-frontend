package com.gu.workflow.lib

import akka.agent.Agent
import models.Status

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object StatusDatabase {

  val store: Agent[List[Status]] = Agent(List(
    Status.Stub,
    Status("Writers"),
    Status("Desk"),
    Status("Production Editor"),
    Status("Subs"),
    Status("Revise"),
    Status("Final"),
    Status("Hold")
  ))

  def statuses: Future[List[Status]] = store.future()

  def find(name: String): Option[Status] = store.get().find(_.name.toUpperCase == name.toUpperCase)

}
