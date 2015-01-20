package controllers

import com.gu.workflow.lib.{StatusDatabase, Formatting}
import models.Response.Response
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



  // can be hidden behind multiple auth endpoints
  val getContentBlock = { implicit req: Request[AnyContent] =>

    val queryData = WfQuery.fromRequest(req)
    val status = queryData.status
    val published = queryData.published

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

  def getContentbyId(composerId: String) = CORSable(PrototypeConfiguration.apply.composerUrl) {
      APIAuthAction { implicit request =>
        contentById(composerId)
      }
    }

  def contentById(composerId: String) = {
    Response(for{
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
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        contentItem <- extractResponse[ContentItem](jsValue).right
        stubId <- PostgresDB.createContent(contentItem).right
      } yield {
        stubId
      })
    }
  }

  def putStub(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        stub <- extractResponse[Stub](jsValue).right
        id <- PostgresDB.updateStub(stubId, stub).right
      } yield {
        id
      })
    }
  }

  def putStubAssignee(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      assignee <- extractResponse[String](jsValue \ "data").right
      id <- PostgresDB.updateStubWithAssignee(stubId, Some(assignee).filter(_.nonEmpty)).right
    } yield {
      id
    })
  }

  def putStubDueDate(stubId: Long) = APIAuthAction { implicit request =>
    Response(for {
      jsValue <- readJsonFromRequestResponse(request.body).right
      dueDateOpt <- extractResponse[Option[String]](jsValue \ "data").right
      id <- PostgresDB.updateStubDueDate(stubId, dueDateOpt.filter(_.length!=0).map(new DateTime(_))).right
    } yield {
      id
    })
  }

  def putStubNote(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        note <- extractResponse[String](jsValue \ "data")(Stub.noteReads).right
        id <- PostgresDB.updateStubNote(stubId, note).right
      } yield {
        id
      })
    }
  }

  def putStubProdOffice(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        prodOffice <- extractResponse[String](jsValue \ "data")(Stub.prodOfficeReads).right
        id <- PostgresDB.updateStubProdOffice(stubId, prodOffice).right
      } yield {
        id
      })
    }
  }

  def putContentStatus(composerId: String) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        status <- extractResponse[String](jsValue \ "data").right
        id <- PostgresDB.updateContentStatus(status, composerId).right
      } yield {
        id
      })
    }
  }

  def putStubSection(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        section <- extractResponse[String](jsValue \ "data" \ "name")(Stub.sectionReads).right
        id <- PostgresDB.updateStubSection(stubId, section).right
      } yield {
        id
      })
    }
  }

  def putStubWorkingTitle(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        workingTitle <- extractResponse[String](jsValue \ "data")(Stub.workingTitleReads).right
        id <- PostgresDB.updateStubWorkingTitle(stubId, workingTitle).right
      } yield {
        id
      })
    }
  }

  def putStubPriority(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        priority <- extractResponse[Int](jsValue \ "data").right
        id <- PostgresDB.updateStubPriority(stubId, priority).right
      } yield {
        id
      })
    }
  }

  def putStubLegalStatus(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction { implicit request =>
      Response(for {
        jsValue <- readJsonFromRequestResponse(request.body).right
        status <- extractResponse[Flag](jsValue \ "data").right
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
      Response(Right(SectionDB.sectionList))
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction(getContentBlock)

  private def readJsonFromRequest(requestBody: AnyContent): Either[Result, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
  }

  //duplicated from the method above to give a standard API response. should move all api methods onto to this
  private def readJsonFromRequestResponse(requestBody: AnyContent): Response[JsValue] = {
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
  private def extractResponse[A: Reads](jsValue: JsValue): Response[A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(a)
      case error@JsError(_) =>
        val errMsg = errorMsgs(error)
        Left((ApiError("JsonParseError", s"failed to parse the json. Error(s): ${errMsg}", 400, "badrequest")))
    }
  }

}
