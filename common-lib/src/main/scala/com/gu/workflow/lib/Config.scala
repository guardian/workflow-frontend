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

  def getConfigWithDefault(name: String, default: String): Either[String, String] = {
    Right(config.getString(name).getOrElse(default))

  }

  def getConfigInt(name: String): Either[String, Int] =
    config.getInt(name) match {
      case None => Left(s"could not read number ${name} from config")
      case Some(num) => Right(num)
    }

  def getConfigBoolean(name: String): Either[String, Boolean] =
    config.getBoolean(name) match {
      case None => Left(s"could not read boolean ${name} from config")
      case Some(bool) => Right(bool)
    }

  def getConfigStringOrFail(name: String): String =
    config.getString(name) match {
      case Some(n) => n
      case None => throw new RuntimeException(s"No config value for: ${name}")
    }

  def getConfigBooleanOrElse(name: String, default: Boolean): Boolean =
    config.getBoolean(name) match {
      case Some(bool) => bool
      case None => default
    }

}
