package com.gu.workflow.lib

import akka.agent.Agent
import models.Status

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object StatusDatabase {

  val store: Agent[List[Status]] = Agent(Status.values.toList)

  def statuses: Future[List[Status]] = store.future()

  def find(name: String): Option[Status] = store.get().find(_.entryName.toUpperCase == name.toUpperCase)
}
