package controllers

import models.ApiResponse.ApiResponse
import models.Flag.Flag
import models._

import play.api.libs.ws.WS
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.concurrent.Akka

import lib.OrderingImplicits.{publishedOrdering, unpublishedOrdering, jodaDateTimeOrdering}
import lib.Responses._
import lib._

import org.joda.time.DateTime

import com.gu.workflow.db.{SectionDB, CommonDB}
import com.gu.workflow.query._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.util.{Failure, Success}
import scala.concurrent.duration._

import akka.actor.Props


case class CORSable[A](origins: String*)(action: Action[A]) extends Action[A] {

  def apply(request: Request[A]): Future[Result] = {

    val headers = request.headers.get("Origin").map { origin =>
      if(origins.contains(origin)) {
        List("Access-Control-Allow-Origin" -> origin, "Access-Control-Allow-Credentials" -> "true")
      } else { Nil }
    }

    action(request).map(_.withHeaders(headers.getOrElse(Nil) :_*))
  }

  lazy val parser = action.parser
}


object Api extends Controller with PanDomainAuthActions {

  def allowCORSAccess(methods: String, args: Any*) = CORSable(PrototypeConfiguration.apply.composerUrl) {

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
    val assigneeEmail = queryStringMultiOption(req.getQueryString("assigneeEmail"))

    val queryData = WfQuery(
      section         = sections,
      status          = status,
      contentType     = contentType,
      prodOffice      = prodOffice,
      dueTimes        = WfQuery.dateTimeToQueryTime(dueFrom, dueUntil),
      creationTimes   = WfQuery.dateTimeToQueryTime(createdFrom, createdUntil),
      flags           = flags,
      published       = published,
      text            = text,
      assignedTo      = assignee,
      assignedToEmail = assigneeEmail
    )

    def getContent = {
      val content = PostgresDB.getContent(queryData)

      val publishedContent = content.filter(d => d.wc.status == models.Status("Final"))
        .sortBy(s => (s.wc.timePublished, s.wc.lastModified))(publishedOrdering)
      val unpublishedContent = content.filterNot(d => d.wc.status == models.Status("Final"))
        .sortBy(d => (d.stub.priority, d.stub.due))(unpublishedOrdering)

      publishedContent ::: unpublishedContent
    }

    def getStubs =
      CommonDB.getStubs(queryData, unlinkedOnly = true)

    val stubs =
      if((status.isEmpty || status.exists(_ == models.Status("Stub"))) &&
           // stubs are never 'published'
           (published != Some(true))) getStubs else Nil

    val content = getContent

    Ok(Json.obj("content" -> content, "stubs" -> stubs))
  }

  def content = APIAuthAction(getContentBlock)

  def getContentbyId(composerId: String) =
    CORSable(PrototypeConfiguration.apply.composerUrl) {
      APIAuthAction { contentById(composerId) }
    }

  def contentById(composerId: String) = { implicit req: Request[AnyContent] =>
    val data = PostgresDB.getContentByComposerId(composerId)
    data.map{s => Ok(renderJsonResponse(s))}.getOrElse(NotFound)
  }

  def sharedAuthGetContentById(composerId: String) = SharedSecretAuthAction(contentById(composerId))

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  val STUB_NOTE_MAXLEN = 500

  def stubs = APIAuthAction { implicit req =>
    stubFilters.bindFromRequest.fold(
      formWithErrors => BadRequest(formWithErrors.errorsAsJson), {
        case (dueFrom, dueUntil) => Ok(renderJsonResponse(
                                         CommonDB.getStubs(
                                           WfQuery(dueTimes = List(WfQueryTime(dueFrom, dueUntil)))
                                         )
                                       ))
      }
    )
  }


  def createContent() = APIAuthAction { implicit request =>
   ApiResponse(for {
      jsValue <- readJsonFromRequestApiResponse(request.body).right
      contentItem <- extractApiResponse[ContentItem](jsValue).right
      stubId <- PostgresDB.createContent(contentItem).right
    } yield {
     stubId
    })
  }

  def putStub(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      stub <- extract[Stub](jsValue).right
    } yield {
      PostgresDB.updateStub(stubId, stub)
      NoContent
    }).merge
  }

  def putStubAssignee(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      assignee <- extract[String](jsValue \ "data").right
    } yield {
      val assignOpt = Some(assignee).filter(_.nonEmpty)
      PostgresDB.updateStubWithAssignee(stubId, assignOpt)
      NoContent
    }).merge
  }

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      assigneeEmail <- extract[String](jsValue \ "data").right
    } yield {
      val assignOpt = Some(assigneeEmail).filter(_.nonEmpty)
      PostgresDB.updateStubWithAssigneeEmail(stubId, assignOpt)
      NoContent
    }).merge
  }

  def putStubDueDate(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
    } yield {
      val dueDate = (jsValue \ "data").asOpt[String] filter {
        _.length != 0
      } map {
        new DateTime(_)
      }
      PostgresDB.updateStubDueDate(stubId, dueDate)
      NoContent
    }).merge
  }

  def putStubNote(stubId: Long) = CORSable(PrototypeConfiguration.apply.composerUrl) {
    APIAuthAction { implicit request =>
      (for {
        jsValue <- readJsonFromRequest(request.body).right
        note <- extract[String](jsValue \ "data")(Stub.noteReads).right
      } yield {
        PostgresDB.updateStubNote(stubId, note)
        NoContent
      }).merge
    }
  }

  def putStubProdOffice(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      prodOffice <- extract[String](jsValue \ "data")(Stub.prodOfficeReads).right
    } yield {
      PostgresDB.updateStubProdOffice(stubId, prodOffice)
      NoContent
    }).merge
  }

  def putContentStatus(composerId: String) = CORSable(PrototypeConfiguration.apply.composerUrl) {
    APIAuthAction { implicit request =>
      (for {
        jsValue <- readJsonFromRequest(request.body).right
        status <- extract[String](jsValue \ "data").right
      } yield {
        PostgresDB.updateContentStatus(status, composerId)
        NoContent
      }).merge
    }
  }

  def putStubSection(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      section <- extract[String](jsValue \ "data" \ "name")(Stub.sectionReads).right
    } yield {
      PostgresDB.updateStubSection(stubId, section)
      NoContent
    }).merge
  }

  def putStubWorkingTitle(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      workingTitle <- extract[String](jsValue \ "data")(Stub.workingTitleReads).right
    } yield {
      PostgresDB.updateStubWorkingTitle(stubId, workingTitle)
      NoContent
    }).merge
  }

  def putStubPriority(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      priority <- extract[Int](jsValue \ "data").right
    } yield {
      PostgresDB.updateStubPriority(stubId, priority)
      NoContent
    }).merge
  }

  def putStubLegalStatus(stubId: Long) = CORSable(PrototypeConfiguration.apply.composerUrl) {
    APIAuthAction { implicit request =>
      (for {
        jsValue <- readJsonFromRequest(request.body).right
        status <- extract[Flag](jsValue \ "data").right
      } yield {
        PostgresDB.updateStubLegalStatus(stubId, status)
        NoContent
      }).merge
    }
  }

  def deleteContent(composerId: String) = APIAuthAction {
    CommonDB.deleteContent(composerId)
    NoContent
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    PostgresDB.deleteStub(stubId)
    NoContent
  }


  def linkStub(stubId: Long, composerId: String, contentType: String) = APIAuthAction { req =>

    if (PostgresDB.stubLinkedToComposer(stubId)) BadRequest(s"stub with id $stubId is linked to a composer item")

    else {
      PostgresDB.updateStubWithComposerId(stubId, composerId, contentType)
      NoContent
    }

  }

  def statusus = CORSable(PrototypeConfiguration.apply.composerUrl) {
    APIAuthAction.async { implicit req =>
      for(statuses <- StatusDatabase.statuses) yield {
        Ok(renderJsonResponse(statuses))
      }
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction(getContentBlock)

  private def readJsonFromRequest(requestBody: AnyContent): Either[Result, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
  }

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  private def readJsonFromRequestApiResponse(requestBody: AnyContent): ApiResponse[JsValue] = {
    requestBody.asJson match {
      case Some(jsValue) => Right(jsValue)
      case None => Left((ApiError("InvalidContentType", "could not read json from the request", 400, "badrequest")))
    }
  }

  /* JsError's may contain a number of different errors for differnt
   * paths. This will aggregate them into a single string */
  private def errorMsgs(error: JsError) =
    (for ((path, msgs) <- error.errors; msg <- msgs)
    yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")

  /* the lone colon in the type paramater makes this a 'context'
   * variance type parameter, which causes the compiler to implicitly
   * add a second implict argument set which provides takes a
   * Reads[A] */
  private def extract[A: Reads](jsValue: JsValue): Either[Result, A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(a)
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left(BadRequest(s"failed to parse the json. Error(s): ${errMsg}"))
    }
  }

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  private def extractApiResponse[A: Reads](jsValue: JsValue): ApiResponse[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(a)
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }

}
