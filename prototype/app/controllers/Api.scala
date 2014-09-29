package controllers

import models.Flag.Flag

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import play.api.libs.json._

import lib.Responses._
import lib._
import models.{Section, WorkflowContent, Stub}
import org.joda.time.DateTime
import com.gu.workflow.db.{SectionDB, CommonDB}
import lib.OrderingImplicits.{publishedOrdering, unpublishedOrdering, jodaDateTimeOrdering}

import scala.concurrent.Future

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

  def content = APIAuthAction { implicit req =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val section = req.getQueryString("section").map(Section(_))
    val contentType = req.getQueryString("content-type")
    val flags = req.queryString.get("flags") getOrElse Nil
    val prodOffice = req.getQueryString("prodOffice")
    val createdFrom = req.getQueryString("created.from").flatMap(Formatting.parseDate)
    val createdUntil = req.getQueryString("created.until").flatMap(Formatting.parseDate)

    val content = PostgresDB.getContent(
      section = req.getQueryString("section").map(Section(_)),
      dueFrom = dueFrom,
      dueUntil = dueUntil,
      status = req.getQueryString("status").flatMap(StatusDatabase.find),
      contentType = contentType,
      published = req.getQueryString("state").map(_ == "published"),
      flags = flags,
      prodOffice = prodOffice,
      createdFrom = createdFrom,
      createdUntil = createdUntil
    )


    val publishedContent = content.filter(d => d.wc.status == models.Status("Final"))
                                  .sortBy(s => (s.wc.timePublished, s.wc.lastModified))(publishedOrdering)
    val unpublishedContent = content.filterNot(d => d.wc.status == models.Status("Final"))
                                   .sortBy(d => (d.stub.priority, d.stub.due))(unpublishedOrdering)
    
    val sortedContent = publishedContent ::: unpublishedContent

    val stubs = CommonDB.getStubs(
      dueFrom = dueFrom,
      dueUntil = dueUntil,
      section = section,
      contentType = contentType,
      unlinkedOnly = true,
      prodOffice = prodOffice,
      createdFrom = createdFrom,
      createdUntil = createdUntil).sortBy(s => (s.priority, s.due))(unpublishedOrdering)

    Ok(Json.obj("content" -> sortedContent, "stubs" -> stubs))
  }

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  val STUB_NOTE_MAXLEN = 500

  def stubs = APIAuthAction { implicit req =>
    stubFilters.bindFromRequest.fold(
    formWithErrors => BadRequest(formWithErrors.errorsAsJson), { case (dueFrom, dueUntil) => Ok(renderJsonResponse(CommonDB.getStubs(dueFrom, dueUntil)))}
    )
  }

  def newStub = APIAuthAction { implicit request =>
    (for {
       jsValue <- readJsonFromRequest(request.body).right
       stub <- extract[Stub](jsValue).right
     } yield {
      PostgresDB.createStub(stub)
       NoContent
     }).merge
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

  def putStubNote(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      note <- extract[String](jsValue \ "data")(Stub.noteReads).right
    } yield {
      PostgresDB.updateStubNote(stubId, note)
      NoContent
    }).merge
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

  def putContentStatus(composerId: String) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[String](jsValue \ "data").right
    } yield {
      PostgresDB.updateContentStatus(status, composerId)
      NoContent
    }).merge
  }

  def putStubLegalStatus(stubId: Long) = APIAuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[Flag](jsValue \ "data").right
    } yield {
      PostgresDB.updateStubLegalStatus(stubId, status)
      NoContent
    }).merge
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

  def statusus = CORSable("https://composer.local.dev-gutools.co.uk") {
    APIAuthAction.async { implicit req =>
      for(statuses <- StatusDatabase.statuses) yield {
        Ok(renderJsonResponse(statuses))
      }
    }
  }

  private def readJsonFromRequest(requestBody: AnyContent): Either[Result, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
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
  
}
