package com.gu.workflow.test

import play.api.test.Helpers

object Config {

  val dropDB: Boolean = sys.env.get("WF_DROP_DB").map(_ == "yes").getOrElse(true)
  val randomSeed: Option[Long] = sys.env.get("WF_RANDOM_SEED").map(_.toLong)

  val appConfig = Map(
    "logging.logstash.enabled" -> false,
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
