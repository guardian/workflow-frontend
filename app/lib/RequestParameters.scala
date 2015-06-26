package lib

import com.gu.workflow.lib.{StatusDatabase, Formatting}
import com.gu.workflow.query._
import models.Flag._
import models.{Flag, Status, Section}
import org.joda.time.DateTime
import play.api.mvc.{AnyContent, Request}
import com.gu.workflow.lib.Formatting._


object RequestParameters {

  def getSeqFromQS(key: String, qs: Map[String, Seq[String]]): Seq[String] = {
    qs.get(key).getOrElse(Nil)
  }

  def getOptionFromQS(key: String, qs: Map[String, Seq[String]]): Option[String] = {
    qs.get(key).flatMap(_.headOption)
  }

  def getComposerId(qs: Map[String, Seq[String]]): Option[String] =  {
    getOptionFromQS("composerId", qs)
  }

  def fromQueryString(qs: Map[String, Seq[String]]): WfQuery = {
    val dueFrom = getOptionFromQS("due.from", qs) flatMap parseDate
    val dueUntil = getOptionFromQS("due.until", qs) flatMap parseDate
    val sections = getSeqFromQS("section", qs) map parseSection

    val contentType   =  getSeqFromQS("content-type", qs)
    val flags         =  getSeqFromQS("flags", qs) flatMap parseFlag
    val prodOffice    =  getSeqFromQS("prodOffice", qs)

    val createdFrom   =  getOptionFromQS("created.from", qs) flatMap parseDate
    val createdUntil  =  getOptionFromQS("created.until", qs) flatMap parseDate

    val status        = getSeqFromQS("status",qs) flatMap parseStatus
    val state         = getOptionFromQS("state", qs) map parseContentState
    val text          = getOptionFromQS("text", qs)
    val assignee      = getSeqFromQS("assignee", qs)
    val assigneeEmail = getSeqFromQS("assigneeEmail",qs)
    val inIncopy      = getOptionFromQS("incopy", qs) flatMap parseBoolean
    val touched       = getSeqFromQS("touched", qs)
    val viewFrom      = getOptionFromQS("view.from", qs) flatMap parseDate
    val viewUntil     = getOptionFromQS("view.until", qs) flatMap parseDate
    val trashed       = getOptionFromQS("trashed", qs) flatMap parseBoolean getOrElse false

    WfQuery(
      section         = sections,
      status          = status,
      contentType     = contentType,
      prodOffice      = prodOffice,
      dueTimes        = WfQuery.dateTimeToQueryTime(dueFrom, dueUntil),
      creationTimes   = WfQuery.dateTimeToQueryTime(createdFrom, createdUntil),
      flags           = flags,
      text            = text,
      assignedTo      = assignee,
      assignedToEmail = assigneeEmail,
      inIncopy        = inIncopy,
      state           = state,
      touched         = touched,
      viewTimes       = DateRange(viewFrom, viewUntil),
      trashed         = trashed
    )
  }


}
