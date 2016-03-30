package controllers

import com.gu.workflow.api.{ ApiUtils, PrototypeAPI }
import com.gu.workflow.lib._
import lib._
import Response.Response
import models.Flag.Flag
import models._
import models.api.ApiResponseFt
import org.joda.time.format.{DateTimeFormatter, DateTimeFormat}

import play.api.libs.ws.WS
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.concurrent.Akka

import lib.OrderingImplicits.{publishedOrdering, unpublishedOrdering, jodaDateTimeOrdering}
import lib.Responses._
import lib.DBToAPIResponse._

import org.joda.time.DateTime

import com.gu.workflow.db._
import com.gu.workflow.query._



import scala.concurrent.Future
import scala.util.{Failure, Success}
import scala.concurrent.duration._

import akka.actor.Props

import config.Config
import config.Config.defaultExecutionContext

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

  val composerUrl = Config.composerUrl

  def allowCORSAccess(methods: String, args: Any*) = CORSable(composerUrl) {

    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }



  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>
    val queryData = RequestParameters.fromRequest(req)

    val contentItems = PostgresDB.getContentItems(queryData)

    val contentResponse = ContentResponse.fromContentItems(contentItems)

    Ok(
      Json.toJson(contentResponse)
    )
  }




  def content = APIAuthAction(getContentBlock)

  def getContentbyId(composerId: String) = CORSable(Config.composerUrl) {
      APIAuthAction { implicit request =>
        contentById(composerId)
      }
    }

  def contentById(composerId: String) = {
    ContentApi.contentByComposerId(composerId)
  }

  def sharedAuthGetContentById(composerId: String) = SharedSecretAuthAction(contentById(composerId))

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  val STUB_NOTE_MAXLEN = 500



  def createContent() =  CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        stubId <- PrototypeAPI.createContent(jsValue)
      } yield {
        stubId
      })
    }
  }

  def putStub(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        putRes <- PrototypeAPI.putStub(stubId, jsValue)
      } yield {
        putRes
      })
    }
  }

  def putStubAssignee(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      assignee <- extractResponse[String](jsValue.data \ "data").right
      assigneeData <- Right(Some(assignee.data).filter(_.nonEmpty)).right
      id <- updateRes(stubId, PostgresDB.updateField(stubId, assigneeData, (s: Schema.DBStub) => s.assignee)).right
    } yield {
      id
    })
  }

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      assigneeEmail <- extractResponse[String](jsValue.data \ "data").right
      assignessEmailData <- Right(Some(assigneeEmail.data).filter(_.nonEmpty)).right
      id <- updateRes(stubId, PostgresDB.updateField(stubId, assignessEmailData,(s: Schema.DBStub) => s.assigneeEmail)).right
    } yield {
      id
    })
  }

  def putStubDueDate(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      dueDateOpt <- extractResponse[Option[String]](jsValue.data \ "data").right
      dueDataData <- Right(dueDateOpt.data.filter(_.length!=0).map(new DateTime(_))).right
      id <- updateRes(stubId, PostgresDB.updateField(stubId, dueDataData,(s: Schema.DBStub) => s.due)).right
    } yield {
      id
    })
  }

  def putStubNote(stubId: Long) = CORSable(composerUrl) {
    def getNoteOpt(input: String): Option[String] = if(input.length > 0) Some(input) else None
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        note <- extractResponse[String](jsValue.data \ "data")(Stub.noteReads).right
        noteOpt <- Right(getNoteOpt(note.data)).right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, noteOpt,(s: Schema.DBStub) => s.note)).right
      } yield {
        id
      })
    }
  }

  def putStubProdOffice(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        prodOffice <- extractResponse[String](jsValue.data \ "data")(Stub.prodOfficeReads).right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, prodOffice.data, (s: Schema.DBStub) => s.prodOffice)).right
      } yield {
        id
      })
    }
  }

  def putContentStatus(composerId: String) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        status <- extractResponse[String](jsValue.data \ "data").right
        id <- updateRes(composerId, PostgresDB.updateContentStatus(status.data, composerId)).right
      } yield {
        id
      })
    }
  }

  def putStubSection(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        section <- extractResponse[String](jsValue.data \ "data" \ "name")(Stub.sectionReads).right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, section.data, (s: Schema.DBStub) => s.section)).right
      } yield {
        id
      })
    }
  }

  def putStubWorkingTitle(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        workingTitle <- extractResponse[String](jsValue.data \ "data")(Stub.workingTitleReads).right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, workingTitle.data, (s: Schema.DBStub) => s.workingTitle)).right
      } yield {
        id
      })
    }
  }

  def putStubPriority(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        priority <- extractResponse[Int](jsValue.data \ "data").right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, priority.data, (s: Schema.DBStub) => s.priority)).right
      } yield {
        id
      })
    }
  }

  def putStubLegalStatus(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        status <- extractResponse[Flag](jsValue.data \ "data").right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, status.data, (s: Schema.DBStub) => s.needsLegal)).right
      } yield {
        id
      })
    }
  }

  def putStubTrashed(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        trashed <- extractResponse[Boolean](jsValue.data \ "data").right
        id <- updateRes(stubId, PostgresDB.updateField(stubId, Some(trashed.data), (s: Schema.DBStub) => s.trashed)).right
      } yield {
        id
      })
    }
  }

  def deleteContent(composerId: String) = APIAuthAction {
    CommonDB.deleteContent(Seq(composerId))
    NoContent
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    PostgresDB.deleteContentByStubId(stubId)
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
      Response(Right(ApiSuccess(SectionDB.sectionList)))
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction(getContentBlock)

  private def readJsonFromRequest(requestBody: AnyContent): Either[Result, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
  }

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  private def readJsonFromRequestResponse(requestBody: AnyContent): Response[JsValue] = {
    requestBody.asJson match {
      case Some(jsValue) => Right(ApiSuccess(jsValue))
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
  private def extractResponse[A: Reads](jsValue: JsValue): Response[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(ApiSuccess(a))
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }

  private def extractApiResponseOption[A: Reads](jsValue: JsValue): Response[Option[A]] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(ApiSuccess(Some(a)))
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }




}
