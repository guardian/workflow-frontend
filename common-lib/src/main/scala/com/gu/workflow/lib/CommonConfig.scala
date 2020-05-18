package com.gu.workflow.lib

import play.api.Configuration

trait CommonConfig {
  import play.api.Play.current
  import scala.collection.JavaConverters._

  private val playConfig: Configuration = play.api.Play.configuration

  protected def getConfigStringList(name: String): Either[String, List[String]] = playConfig.getStringList(name) match {
    case Some(list) => Right(list.asScala.toList)
    case None => Left(s"could not find $name")
  }

  protected def getConfigString(name: String): Either[String, String] = playConfig.getString(name) match {
    case Some("") => Left(s"empty string set for $name")
    case Some(value) => Right(value)
    case None => Left(s"could not find $name")
  }

  protected def getConfigStringOrFail(name: String): String = playConfig.getString(name) match {
    case Some(n) => n
    case None => throw new RuntimeException(s"No config value for: $name")
  }

  lazy val apiRoot: String = getConfigStringOrFail("api.url")
}

object CommonConfig extends CommonConfig
