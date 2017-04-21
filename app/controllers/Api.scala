package controllers

import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.api.{ ApiUtils, CommonAPI, PrototypeAPI, SectionsAPI }
import com.gu.workflow.lib._
import models.Flag.Flag
import models._
import models.api.ApiResponseFt
import play.api.Logger

import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import play.api.libs.json._

import lib.Responses._

import org.joda.time.DateTime

import scala.concurrent.Future

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

  implicit val flatStubWrites = Stub.flatStubWrites

  def allowCORSAccess(methods: String, args: Any*) = CORSable(composerUrl) {

    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }

  // can be hidden behind multiple auth endpoints
  def getContentBlock[R] = { implicit req: R =>
    val qs = req match {
      case r: UserRequest[_] => r.queryString + ("email" -> Seq(r.user.email))
      case r: Request[_] => r.queryString
    }
    CommonAPI.getContent(qs).asFuture.map {
      case Left(err) => InternalServerError
      case Right(contentResponse) => Ok(Json.toJson(contentResponse))
    }
  }

  def content = APIAuthAction.async(getContentBlock)

  def getContentbyId(composerId: String) = CORSable(Config.composerUrl) {
      APIAuthAction.async { implicit request =>
        ApiResponseFt[Option[Stub]](for {
          item <- ContentApi.contentByComposerId(composerId)
        } yield {
          item
        })(Writes.OptionWrites(Stub.flatStubWrites), defaultExecutionContext)
      }
    }

  def sharedAuthGetContentById(composerId: String) =
    SharedSecretAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- ContentApi.contentByComposerId(composerId)
      } yield {
        item
      })(Writes.OptionWrites(Stub.flatStubWrites), defaultExecutionContext)
    }

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

  def putStubAssignee(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
      assignee <- ApiUtils.extractDataResponse[String](jsValue)
      assigneeData = Some(assignee).filter(_.nonEmpty)
      id <- PrototypeAPI.putStubAssignee(stubId, assigneeData)
    } yield {
      id
    })
  }

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
      assignee <- ApiUtils.extractDataResponse[String](jsValue)
      assigneeEmailData = Some(assignee).filter(_.nonEmpty)
      id <- PrototypeAPI.putStubAssigneeEmail(stubId, assigneeEmailData)
    } yield {
      id
    })
  }

  def putStubDueDate(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
      dueDateOpt <- ApiUtils.extractDataResponseOpt[String](jsValue)
      dueDateData = dueDateOpt.map(new DateTime(_))
      id <- PrototypeAPI.putStubDue(stubId, dueDateData)
    } yield {
      id
    })
  }

  def putStubNote(stubId: Long) = CORSable(composerUrl) {
    def getNoteOpt(input: String): Option[String] = if(input.length > 0) Some(input) else None
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        note <- ApiUtils.extractDataResponse[String](jsValue)(Stub.noteReads)
        noteOpt = getNoteOpt(note)
        id <- PrototypeAPI.putStubNote(stubId, noteOpt)
      } yield {
        id
      })
    }
  }

  def putStubProdOffice(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        prodOffice <- ApiUtils.extractDataResponse[String](jsValue)(Stub.prodOfficeReads)
        id <- PrototypeAPI.putStubProdOffice(stubId, prodOffice)
      } yield {
        id
      })
    }
  }

  def putStubStatus(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[String](jsValue)
        id <- PrototypeAPI.updateContentStatus(stubId, status)
      } yield {
        id
      })
    }
  }

  def putStubStatusByComposerId(composerId: String) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[String](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[String](jsValue)
        id <- PrototypeAPI.updateContentStatusByComposerId(composerId, status)
      } yield {
        id
      })
    }
  }

  def putStubSection(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        section <- ApiUtils.extractResponse[String](jsValue \ "data" \ "name")
        id <- PrototypeAPI.putStubSection(stubId, section)
      } yield {
        id
      })
    }
  }

  def putStubWorkingTitle(stubId: Long) =  CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        wt <- ApiUtils.extractDataResponse[String](jsValue)(Stub.workingTitleReads)
        id <- PrototypeAPI.putStubWorkingTitle(stubId, wt)
      } yield {
        id
      })
    }
  }

  def putStubPriority(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        priority <- ApiUtils.extractDataResponse[Int](jsValue)
        id <- PrototypeAPI.putStubPriority(stubId, priority)
      } yield {
        id
      })
    }
  }

  def putStubLegalStatus(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[Flag](jsValue)
        id <- PrototypeAPI.putStubLegalStatus(stubId, status)
      } yield {
        id
      })
    }
  }

  def putStubTrashed(stubId: Long) = CORSable(composerUrl) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        trashed <- ApiUtils.extractDataResponse[Boolean](jsValue)
        id <- PrototypeAPI.putStubTrashed(stubId, trashed)
      } yield {
        id
      })
    }
  }

  def deleteContent(composerId: String) = CORSable(composerUrl) {
    APIAuthAction {
      CommonAPI.deleteContent(Seq(composerId)).fold(err =>
        Logger.error(s"failed to delete content with composer id: $composerId"), identity)
      NoContent
    }
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    PrototypeAPI.deleteContentByStubId(stubId).fold(err =>
    Logger.error(s"failed to delete content with stub id: $stubId"), identity)
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
    AuthAction.async  {request =>
      ApiResponseFt[List[Section]](for {
        sections <- SectionsAPI.getSections()
      } yield {
        sections
      })
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction.async(getContentBlock)
}
