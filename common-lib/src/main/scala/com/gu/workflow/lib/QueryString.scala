package com.gu.workflow.lib

import com.gu.pandomainauth.action.UserRequest
import play.api.mvc.Request

object QueryString {
  def fromRequest[R <: Request[_]](req: R): Map[String, Seq[String]] = req match {
    case r: UserRequest[_] => r.queryString + ("email" -> Seq(r.user.email))
    case r: Request[_] => r.queryString
  }

  def flatten(qs: Map[String, Seq[String]]): Seq[(String, String)] = {
    qs.toList.flatMap(x => x._2 map ( y => x._1 -> y))
  }
}
