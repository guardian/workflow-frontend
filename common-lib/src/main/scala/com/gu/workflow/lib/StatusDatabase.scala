package com.gu.workflow.lib

import models.Status

object StatusDatabase {

  val statuses: List[Status] = Status.values.toList

  def find(name: String): Option[Status] = statuses.find(_.entryName.toUpperCase == name.toUpperCase)
}
