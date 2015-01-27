package com.gu.workflow.lib

import akka.agent.Agent
import models.Status

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global


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

  def statuses = store.future()

  def find(name: String) = store.get().find(_.name.toUpperCase == name.toUpperCase)

}
