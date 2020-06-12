package com.gu.workflow.lib

object QueryString {
  def flatten(qs: Map[String, Seq[String]]): List[(String, String)] = {
    qs.toList.flatMap(x => x._2 map ( y => x._1 -> y))
  }
}
