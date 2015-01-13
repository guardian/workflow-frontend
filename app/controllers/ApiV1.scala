package controllers

import com.gu.workflow.db.CommonDB
import com.gu.workflow.query.WfQuery
import controllers.Api._
import lib.OrderingImplicits._
import lib.{PostgresDB, StatusDatabase, Formatting, PrototypeConfiguration}
import models.{ApiResponse, Section}
import play.api.libs.json.Json
import play.api.mvc.{Action, AnyContent, Request, Controller}


object ApiV1 extends Controller with PanDomainAuthActions {


  val composerUrl = PrototypeConfiguration.apply.composerUrl

  def allowCORSAccess(methods: String, args: Any*) = CORSable(composerUrl) {

    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }

  def queryStringMultiOption[A](param: Option[String],
                                // default transformer just makes
                                // Option using Sum.apply
                                f: String => Option[A] = (s: String) => Some(s)): List[A] =
  // conver the query string into a list of filters by separating on
  // "," and pass to the transformation function to get the required
  // type. If the param doesn't exist in the query string, assume
  // the empty list
    param map {
      _.split(",").toList.map(f).collect { case Some(a) => a }
    } getOrElse Nil

  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val sections = queryStringMultiOption(req.getQueryString("section"),
      s => Some(Section(s)))
    val contentType = queryStringMultiOption(req.getQueryString("content-type"))
    val flags = queryStringMultiOption(req.getQueryString("flags"),
      WfQuery.queryStringToFlag.get(_))
    val prodOffice = queryStringMultiOption(req.getQueryString("prodOffice"))
    val createdFrom = req.getQueryString("created.from").flatMap(Formatting.parseDate)
    val createdUntil = req.getQueryString("created.until").flatMap(Formatting.parseDate)
    val status = queryStringMultiOption(req.getQueryString("status"), StatusDatabase.find(_))
    val published = req.getQueryString("state").map(_ == "published")
    val text = req.getQueryString("text")
    val assignee = queryStringMultiOption(req.getQueryString("assignee"))

    val queryData = WfQuery(
      section       = sections,
      status        = status,
      contentType   = contentType,
      prodOffice    = prodOffice,
      dueTimes      = WfQuery.dateTimeToQueryTime(dueFrom, dueUntil),
      creationTimes = WfQuery.dateTimeToQueryTime(createdFrom, createdUntil),
      flags         = flags,
      published     = published,
      text          = text,
      assignedTo    = assignee
    )
    ApiResponse(for{
      content <- PostgresDB.getContentItems(queryData).right
    }yield {
      content
    })

  }

  def content = APIAuthAction(getContentBlock)

  def contentById(id: Long) = APIAuthAction {
    ApiResponse(
      for {
        cItem <- PostgresDB.getContentById(id).right
      } yield {
        cItem
      }
    )
  }
}
