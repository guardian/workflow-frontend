package com.gu.workflow.lib

object Config {
  import play.api.Play.current
  val config = play.api.Play.configuration

  def getConfigString(name: String): Either[String, String] = {
    config.getString(name) match {
      case Some(value) => Right(value)
      case None => Left(s"could not find ${name}")
    }
  }
}
