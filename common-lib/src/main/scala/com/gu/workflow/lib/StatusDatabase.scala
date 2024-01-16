package com.gu.workflow.lib

import akka.agent.Agent
import models.Status

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

object StatusDatabase {

  private val store: Agent[List[Status]] = Agent(Status.values.toList)

  def statuses: List[Status] = store.get()

  def find(name: String): Option[Status] = store.get().find(_.entryName.toUpperCase == name.toUpperCase)
}
