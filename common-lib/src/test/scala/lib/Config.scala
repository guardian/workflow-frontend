package com.gu.workflow.test

import play.api.test.Helpers

object Config {

  val dbName: String = sys.env.get("WF_DB_NAME").getOrElse("default")
  val dbUrl: String = sys.env.get("WF_DB_URL").getOrElse(throw new Exception("WF_DB_URL must be defined in your env"))
  val dbUser: String = sys.env.get("WF_DB_USER").getOrElse(throw new Exception("WF_DB_USER must be defined in your env"))
  val dbPass: String = sys.env.get("WF_DB_PASS").getOrElse(throw new Exception("WF_DB_PASS must be defined in your env"))
  def dbFullUrl: String = {
    val s = dbUrl ++ dbName
    println(s"Connecting to database: $s")
    s
  }
  val dropDB: Boolean = sys.env.get("WF_DROP_DB").map(_ == "yes").getOrElse(true)
  val randomSeed: Option[Long] = sys.env.get("WF_RANDOM_SEED").map(_.toLong)

  val appConfig = Map(
    "logging.logstash.enabled" -> false,
    "db.default.url"           -> dbFullUrl,
    "db.default.user"          -> dbUser,
    "db.default.password"      -> dbPass,
    "db.default.driver"        -> "org.postgresql.Driver",
    "host"                     -> s"http://localhost:${Helpers.testServerPort}",
    "archiver.enabled"         -> false,
    "aws.key"                  -> "key",
    "aws.secret"                -> "secret",
    "aws.flex.notifications.queue" -> "queue",
    "logging.logstash.host" -> "host",
    "logging.logstash.port" -> 1,
    "evolutionplugin" -> "enabled",
    "applyEvolutions.default" -> true,
    "applyDownEvolutions" -> true,
    "pandomain.domain" -> "localhost"
  )
}
