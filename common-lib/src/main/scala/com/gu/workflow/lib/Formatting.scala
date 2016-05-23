package com.gu.workflow.lib

import com.gu.workflow.query._
import models.Flag._
import models.{Flag, Status, Section}
import org.joda.time.DateTime
import org.joda.time.format.{DateTimeFormat, ISODateTimeFormat}

import scala.util.control.NonFatal

object Formatting {

  /**
   * Parses a date from a string in ISO8601 format. Relaxed parsing whereby
   * milliseconds, seconds, time can be omitted.
   *
   *
   */
  def parseDate(dateString: String): Option[DateTime] = dateString match {
    case "" => None
    case _ => {
      try {
        Some(ISODateTimeFormat.dateTimeParser.parseDateTime(dateString))
      }
      catch {
        case NonFatal(error) => None
      }
    }
  }

  val displayPattern:  String = "d MMM HH:mm"

  def displayDate(date: DateTime) = DateTimeFormat.forPattern(displayPattern).print(date)

  def parseSection(s: String): Section = Section(s)

  def parseFlag(fs: String): Option[Flag] = queryStringToFlag.get(fs)

  def parseStatus(s: String): Option[Status] =  StatusDatabase.find(s)

  def parseBoolean(s: String): Option[Boolean] = {
    s match {
      case "true" => Some(true)
      case "false" => Some(false)
      case _ => None
    }
  }

  def parsePublished(s: String):Option[Boolean] = {
    s match {
      case "published" => Some(true)
      case _ => None
    }
  }

  def parseContentState(s: String): ContentState = s match {
    case "published" => PublishedState
    case "takendown" => TakenDownState
    case "scheduled" => ScheduledState
    case "embargoed" => EmbargoedState
    case "draft"     => DraftState
    case default     => UnknownState(default)
  }

  val queryStringToFlag = Map("needsLegal" -> Flag.Required,
    "approved" -> Flag.Complete,
    "notRequired" -> Flag.NotRequired)

}
