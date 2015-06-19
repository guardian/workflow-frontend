package controllers

import com.gu.workflow.lib._
import lib._
import Response.Response
import models.Flag.Flag
import models._
import org.joda.time.format.{DateTimeFormatter, DateTimeFormat}

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

import lib.PrototypeConfiguration.defaultExecutionContext

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



  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>

    val queryData = WfQuery.fromRequest(req)
    val state     = queryData.state
    val status    = queryData.status
    val touched   = queryData.touched
    val published = queryData.published
    val assigned  = queryData.assignedToEmail
    val view      = queryData.viewTimes

    def getContent = {
        if(queryData.composerId.isDefined) {
          PostgresDB.contentItemLookup(queryData.composerId.get)
        }
        else {
          PostgresDB.getContent(queryData)
        }
    }

    def getStubs =
      CommonDB.getStubs(queryData, unlinkedOnly = true)

    val stubs =
      if((status.isEmpty || status.exists(_ == models.Status("Stub"))) &&
        (state.isEmpty   || state == Some(DraftState)) &&
        (queryData.inIncopy != Some(true)) &&
        touched.isEmpty &&
        assigned.isEmpty &&
        queryData.composerId.isEmpty
      ) getStubs else Nil

    val contentGroupedByStatus = getContent.groupBy(_.wc.status)

    val jsContentGroupedByStatus = contentGroupedByStatus.map({
      case (status, content) => (status.toString, Json.toJson(content))
    }).toSeq

    var countTotal = 0

    val counts = contentGroupedByStatus.map({
      case (status, content) => {
        countTotal += content.length
        (status.toString, Json.toJson(content.length))
      }
    }).toSeq ++ Map("Stub" -> Json.toJson(stubs.length)).toSeq ++ Map("total" -> Json.toJson(countTotal+stubs.length)).toSeq

    Ok(
      Json.obj(
        "content" -> JsObject(jsContentGroupedByStatus),
        "stubs" -> stubs,
        "count" -> JsObject(counts)
      )
    )
  }

  def content = APIAuthAction(getContentBlock)

  def getContentbyId(composerId: String) = CORSable(PrototypeConfiguration.apply.composerUrl) {
      APIAuthAction { implicit request =>
        contentById(composerId)
      }
    }

  def contentById(composerId: String) = {
    Response(for{
      data <- PostgresDB.getDashboardRowByComposerId(composerId).right
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
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        stub <- extractResponse[Stub](jsValue.data).right
        wcOpt <- (if(stub.data.composerId.isDefined) extractApiResponseOption[WorkflowContent](jsValue.data)
                  else extractResponse[Option[WorkflowContent]](jsValue.data)).right
        stubId <- PostgresDB.createContent(ContentItem(stub.data, wcOpt.data)).right
      } yield {
        stubId
      })
    }
  }

  def putStub(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        stub <- extractResponse[Stub](jsValue.data).right
        wcOpt <- (if(stub.data.composerId.isDefined) extractApiResponseOption[WorkflowContent](jsValue.data)
                  else extractResponse[Option[WorkflowContent]](jsValue.data)).right
        id <- PostgresDB.updateContentItem(stubId, ContentItem(stub.data, wcOpt.data)).right
      } yield {
        id
      })
    }
  }

  def putStubAssignee(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      assignee <- extractResponse[String](jsValue.data \ "data").right
      id <- PostgresDB.updateStubWithAssignee(stubId, Some(assignee.data).filter(_.nonEmpty)).right
    } yield {
      id
    })
  }

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      assigneeEmail <- extractResponse[String](jsValue.data \ "data").right
      id <- PostgresDB.updateStubWithAssigneeEmail(stubId, Some(assigneeEmail.data).filter(_.nonEmpty)).right
    } yield {
      id
    })
  }

  def putStubDueDate(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      dueDateOpt <- extractResponse[Option[String]](jsValue.data \ "data").right
      id <- PostgresDB.updateStubDueDate(stubId, dueDateOpt.data.filter(_.length!=0).map(new DateTime(_))).right
    } yield {
      id
    })
  }

  def putStubNote(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        note <- extractResponse[String](jsValue.data \ "data")(Stub.noteReads).right
        id <- PostgresDB.updateStubNote(stubId, note.data).right
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
        id <- PostgresDB.updateStubProdOffice(stubId, prodOffice.data).right
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
        id <- PostgresDB.updateContentStatus(status.data, composerId).right
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
        id <- PostgresDB.updateStubSection(stubId, section.data).right
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
        id <- PostgresDB.updateStubWorkingTitle(stubId, workingTitle.data).right
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
        id <- PostgresDB.updateStubPriority(stubId, priority.data).right
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
        id <- PostgresDB.updateStubLegalStatus(stubId, status.data).right
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
        id <- PostgresDB.updateStubTrashed(stubId, Some(trashed.data)).right
      } yield {
        id
      })
    }
  }

  def deleteContent(composerId: String) = APIAuthAction {
    CommonDB.removeFromUI(composerId)
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
