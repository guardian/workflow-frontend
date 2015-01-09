package com.gu.workflow.lib

object Config {
  import play.api.Play.current
  import scala.collection.JavaConverters._

  val config = play.api.Play.configuration

  def getConfigStringList(name: String): Either[String, List[String]] = {
    config.getStringList(name) match {
      case Some(list) => Right(list.asScala.toList) 
      case None => Left(s"could not find ${name}")
    }
  }

  def getConfigString(name: String): Either[String, String] = {
    config.getString(name) match {
      case Some("") => Left(s"empty string set for ${name}")
      case Some(value) => Right(value)
      case None => Left(s"could not find ${name}")
    }
  }
}
