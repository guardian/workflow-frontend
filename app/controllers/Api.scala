package controllers

import models.Flag.Flag

import scala.concurrent.ExecutionContext.Implicits.global

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc.{AnyContent, Result, Controller}
import play.api.libs.json._

import lib.Responses._
import lib._
import models.{Section, WorkflowContent, Stub}
import org.joda.time.DateTime
import com.gu.workflow.db.{SectionDB, CommonDB}

object Api extends Controller with PanDomainAuthActions {

  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  def content = AuthAction { implicit req =>
    val dueFrom = req.getQueryString("due.from").flatMap(Formatting.parseDate)
    val dueUntil = req.getQueryString("due.until").flatMap(Formatting.parseDate)
    val section = req.getQueryString("section").map(Section(_))
    val contentType = req.getQueryString("content-type")
    val flags = req.queryString.get("flags") getOrElse Nil
    val prodOffice = req.getQueryString("prodOffice")

    val content = PostgresDB.getContent(
      section = req.getQueryString("section").map(Section(_)),
      dueFrom = dueFrom,
      dueUntil = dueUntil,
      status = req.getQueryString("status").flatMap(StatusDatabase.find),
      contentType = contentType,
      published = req.getQueryString("state").map(_ == "published"),
      flags = flags,
      prodOffice = prodOffice
    )

    val stubs = CommonDB.getStubs(
                  dueFrom = dueFrom,
                  dueUntil = dueUntil,
                  section = section,
                  contentType = contentType,
                  unlinkedOnly = true,
                  prodOffice = prodOffice)

    Ok(Json.obj("content" -> content, "stubs" -> stubs))
  }

  val iso8601DateTime = jodaDate("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  val iso8601DateTimeNoMillis = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  val stubFilters: Form[(Option[DateTime], Option[DateTime])] =
    Form(tuple("due.from" -> optional(iso8601DateTimeNoMillis), "due.until" -> optional(iso8601DateTimeNoMillis)))

  val STUB_NOTE_MAXLEN = 500

  def stubs = AuthAction { implicit req =>
    stubFilters.bindFromRequest.fold(
      formWithErrors => BadRequest(formWithErrors.errorsAsJson),
      { case (dueFrom, dueUntil) => Ok(renderJsonResponse(CommonDB.getStubs(dueFrom, dueUntil))) }
    )
  }

  def newStub = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      stub <- extract[Stub](jsValue).right
    } yield {
      PostgresDB.createStub(stub)
      NoContent
    }).merge
  }

  def putStub(stubId: Long) = AuthAction { implicit request =>
    (for {
          jsValue <- readJsonFromRequest(request.body).right
          stub <- extract[Stub](jsValue).right
        } yield {
          PostgresDB.updateStub(stubId, stub)
          NoContent
     }).merge
  }

  def putStubAssignee(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      assignee <- extract[String](jsValue \ "data").right
    } yield {
        val assignOpt = Some(assignee).filter(_.nonEmpty)
        PostgresDB.updateStubWithAssignee(stubId, assignOpt)
        NoContent
    }).merge
  }

  def putStubDueDate(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
    } yield {
        val dueDate = (jsValue \ "data").asOpt[String] filter { _.length != 0 } map { new DateTime(_) }
        PostgresDB.updateStubDueDate(stubId, dueDate)
        NoContent
    }).merge
  }

  def putStubNote(stubId: Long) = AuthAction { implicit request =>
    (for {
       jsValue <- readJsonFromRequest(request.body).right
       note    <- extract[String](jsValue \ "data")(Stub.noteReads).right
     } yield {
       PostgresDB.updateStubNote(stubId, note)
       NoContent
     }).merge
  }

  def putStubProdOffice(stubId: Long) = AuthAction { implicit request =>
    (for {
       jsValue    <- readJsonFromRequest(request.body).right
       prodOffice <- extract[String](jsValue \ "data")(Stub.prodOfficeReads).right
     } yield {
       PostgresDB.updateStubProdOffice(stubId, prodOffice)
       NoContent
     }).merge
  }

  def putContentStatus(composerId: String) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[String](jsValue \ "data").right
    } yield {
      PostgresDB.updateContentStatus(status, composerId)
      NoContent
    }).merge
  }

  def putStubLegalStatus(stubId: Long) = AuthAction { implicit request =>
    (for {
      jsValue <- readJsonFromRequest(request.body).right
      status <- extract[Flag](jsValue \ "data").right
    } yield {
      PostgresDB.updateStubLegalStatus(stubId, status)
      NoContent
    }).merge
  }

  def deleteContent(composerId: String) = AuthAction {
    CommonDB.deleteContent(composerId)
    NoContent
  }

  def deleteStub(stubId: Long) = AuthAction {
    PostgresDB.deleteStub(stubId)
    NoContent
  }


  def linkStub(stubId: Long, composerId: String, contentType: String) = AuthAction { req =>

    if(PostgresDB.stubLinkedToComposer(stubId)) BadRequest(s"stub with id $stubId is linked to a composer item")

    else {
      PostgresDB.updateStubWithComposerId(stubId, composerId, contentType)
      NoContent
    }

  }

  private def readJsonFromRequest(requestBody: AnyContent): Either[Result, JsValue] = {
    requestBody.asJson.toRight(BadRequest("could not read json from the request body"))
  }

  /* JsError's may contain a number of different errors for differnt
   * paths. This will aggregate them into a single string */
  private def errorMsgs(error: JsError) =
    (for((path, msgs) <- error.errors; msg <- msgs)
     yield s"$path: ${msg.message}(${msg.args.mkString(",")})").mkString(";")

  /* the lone colon in the type paramater makes this a 'context'
   * variance type parameter, which causes the compiler to implicitly
   * add a second implict argument set which provides takes a
   * Reads[A] */
  private def extract[A: Reads](jsValue: JsValue): Either[Result, A] = {
    jsValue.validate[A] match {
      case JsSuccess(a, _) => Right(a)
      case error @ JsError(_) =>
        val errMsg = errorMsgs(error)
        Left(BadRequest(s"failed to parse the json. Error(s): ${errMsg}"))
    }
  }
}


