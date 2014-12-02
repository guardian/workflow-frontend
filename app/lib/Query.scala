package lib

import scala.slick.ast.BaseTypedType
import scala.slick.driver.PostgresDriver.simple._
import scala.slick.lifted.{Query, Column, ExtensionMethodConversions}
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

object WfQuery {
  def inSet[A : BaseTypedType, DB, Row](options: Seq[A],
                                            getField: DB => Column[A]):
      (Query[DB, Row]) => Query[DB, Row] = options match {

    // no options provided, return query unchanged
    case Nil  => (startQuery => startQuery)
    case opts => { startQuery =>
      startQuery.filter(table => getField(table) inSet options)
    }
  }

  def optToSeq[A](o: Option[A]): Seq[A] =
    o map (List(_)) getOrElse Nil

  def dateTimeToQueryTime(from: Option[DateTime], until: Option[DateTime]) =
    (from, until) match {
      case (None, None)  => Nil
      case (from, until) => List(WfQueryTime(from, until))
    }

  def fromOptions(
    section:      Option[List[Section]]  = None,
    desk:         Option[Desk]     = None,
    dueFrom:      Option[DateTime] = None,
    dueUntil:     Option[DateTime] = None,
    status:       Option[Status]   = None,
    contentType:  Option[String]   = None,
    published:    Option[Boolean]  = None,
    flags:        Seq[String]      = Nil,
    prodOffice:   Option[String]   = None,
    createdFrom:  Option[DateTime] = None,
                  createdUntil: Option[DateTime] = None
  ): WfQuery = WfQuery(
    section getOrElse Nil,
    optToSeq(desk),
    dateTimeToQueryTime(dueFrom, dueUntil),
    optToSeq(status),
    optToSeq(contentType),
    published,
    flags,
    optToSeq(prodOffice),
    dateTimeToQueryTime(createdFrom, createdUntil)
  )

}
