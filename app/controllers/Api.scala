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

import com.gu.workflow.db.{DeskDB, SectionDeskMappingDB, SectionDB, CommonDB}
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

    def getContent = {
       PostgresDB.getContent(queryData)
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

  def getContentbyId(composerId: String) = CORSable(PrototypeConfiguration.apply.composerUrl) {
      APIAuthAction { implicit request =>
        contentById(composerId)
      }
    }

  def contentById(composerId: String) = {
    ApiResponse(for{
      data <- PostgresDB.getContentByComposerId(composerId).right
    }yield {
      data
    })
  }

  def sharedAuthGetContentById(composerId: String) = SharedSecretAuthAction(contentById(composerId))

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  val STUB_NOTE_MAXLEN = 500

  def stubs = CORSable(composerUrl) {
    APIAuthAction { implicit req =>
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
  }


  def createContent() =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        stub <- extractApiResponse[Stub](jsValue).right
        wcOpt <- (if(stub.composerId.isDefined) extractApiResponseOption[WorkflowContent](jsValue) else extractApiResponse[Option[WorkflowContent]](jsValue)).right
        stubId <- PostgresDB.createContent(ContentItem(stub, wcOpt)).right
      } yield {
        stubId
      })
    }
  }

  def putStub(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        stub <- extractApiResponse[Stub](jsValue).right
        id <- PostgresDB.updateStub(stubId, stub).right
      } yield {
        id
      })
    }
  }

  def putStubAssignee(stubId: Long) = APIAuthAction { implicit request =>
    ApiResponse(for {
      jsValue <- readJsonFromRequestApiResponse(request.body).right
      assignee <- extractApiResponse[String](jsValue \ "data").right
      id <- PostgresDB.updateStubWithAssignee(stubId, Some(assignee).filter(_.nonEmpty)).right
    } yield {
      id
    })
  }

  def putStubDueDate(stubId: Long) = APIAuthAction { implicit request =>
    ApiResponse(for {
      jsValue <- readJsonFromRequestApiResponse(request.body).right
      dueDateOpt <- extractApiResponse[Option[String]](jsValue \ "data").right
      id <- PostgresDB.updateStubDueDate(stubId, dueDateOpt.filter(_.length!=0).map(new DateTime(_))).right
    } yield {
      id
    })
  }

  def putStubNote(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        note <- extractApiResponse[String](jsValue \ "data")(Stub.noteReads).right
        id <- PostgresDB.updateStubNote(stubId, note).right
      } yield {
        id
      })
    }
  }

  def putStubProdOffice(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        prodOffice <- extractApiResponse[String](jsValue \ "data")(Stub.prodOfficeReads).right
        id <- PostgresDB.updateStubProdOffice(stubId, prodOffice).right
      } yield {
        id
      })
    }
  }

  def putContentStatus(composerId: String) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        status <- extractApiResponse[String](jsValue \ "data").right
        id <- PostgresDB.updateContentStatus(status, composerId).right
      } yield {
        id
      })
    }
  }

  def putStubSection(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        section <- extractApiResponse[String](jsValue \ "data" \ "name")(Stub.sectionReads).right
        id <- PostgresDB.updateStubSection(stubId, section).right
      } yield {
        id
      })
    }
  }

  def putStubWorkingTitle(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        workingTitle <- extractApiResponse[String](jsValue \ "data")(Stub.workingTitleReads).right
        id <- PostgresDB.updateStubWorkingTitle(stubId, workingTitle).right
      } yield {
        id
      })
    }
  }

  def putStubPriority(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        priority <- extractApiResponse[Int](jsValue \ "data").right
        id <- PostgresDB.updateStubPriority(stubId, priority).right
      } yield {
        id
      })
    }
  }

  def putStubLegalStatus(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      ApiResponse(for {
        jsValue <- readJsonFromRequestApiResponse(request.body).right
        status <- extractApiResponse[Flag](jsValue \ "data").right
        id <- PostgresDB.updateStubLegalStatus(stubId, status).right
      } yield {
        id
      })
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

  def statusus = CORSable(composerUrl)  {
    APIAuthAction.async { implicit req =>
      for(statuses <- StatusDatabase.statuses) yield {
        Ok(renderJsonResponse(statuses))
      }
    }
  }

  def sections = CORSable(composerUrl) {
    AuthAction  { implicit request =>
      ApiResponse(Right(SectionDB.sectionList))
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
  //todo - add a transformer to take an ApiResponse[A] to ApiResponse[Option[A]]
  private def extractApiResponseOption[A: Reads](jsValue: JsValue): ApiResponse[Option[A]] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(Some(a))
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }

}
