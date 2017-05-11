package com.gu.workflow.lib

import net.logstash.logback.marker.Markers._
import play.api.Logger
import play.api.libs.json.{Json, Reads}

import scala.collection.JavaConverters._

case class ClientLog( message: String,
                      level: String,
                      timestamp: String,
                      fields: Option[Map[String, String]]
                      )
object ClientLog {
  implicit val jsonReads: Reads[ClientLog] = Json.reads[ClientLog]

}
object ClientMessageLoggable {
  def logClientMessage(log: ClientLog) {
    val scalaMap = Map("client_timestamp" -> log.timestamp) ++
      log.fields.getOrElse(Map.empty)

    val fieldsMap = scalaMap.asJava
    val output = log.message
    log.level match {
      case "ERROR" => Logger.logger.error(appendEntries(fieldsMap),output)
      case "WARN" => Logger.logger.warn(appendEntries(fieldsMap),output)
      case "INFO" => Logger.logger.info(appendEntries(fieldsMap),output)
      case "DEBUG" =>  Logger.logger.debug(appendEntries(fieldsMap),output)
      case _ =>  Logger.logger.info(appendEntries(fieldsMap),output)
    }
  }
}
