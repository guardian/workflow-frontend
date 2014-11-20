package lib

import models._
import org.joda.time.DateTime

case class WfQueryTime(
  from  : Option[DateTime],
  until : Option[DateTime]
)

case class WfQuery(
  section       : Seq[Section]     = Nil,
  desk          : Seq[Desk]        = Nil,
  dueTimes      : Seq[WfQueryTime] = Nil,
  status        : Seq[Status]      = Nil,
  contentType   : Seq[String]      = Nil,
  published     : Option[Boolean]  = None,
  // TODO XXX -> is this currently AND or OR?
  flags         : Seq[String]      = Nil,
  prodOffice    : Seq[String]      = Nil,
  creationTimes : Seq[WfQueryTime] = Nil
)
