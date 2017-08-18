package controllers

import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.api.{ApiUtils, CommonAPI, PrototypeAPI, SectionsAPI}
import com.gu.workflow.lib._
import config.Config
import config.Config.defaultExecutionContext
import lib.Responses._
import models.Flag.Flag
import models._
import models.api.ApiResponseFt
import org.joda.time.DateTime
import play.api.Logger
import play.api.data.Forms._
import play.api.data.Mapping
import play.api.libs.json._
import play.api.mvc._
import com.gu.workflow.lib.DBToAPIResponse.getResponse

import scala.concurrent.Future

case class CORSable[A](allowedOrigins: Set[String])(action: Action[A]) extends Action[A] {

  def apply(request: Request[A]): Future[Result] = {

    val headers = request.headers.get("Origin").map { origin =>
      if(allowedOrigins.contains(origin)) {
        List("Access-Control-Allow-Origin" -> origin, "Access-Control-Allow-Credentials" -> "true")
      } else { Nil }
    }

    action(request).map(_.withHeaders(headers.getOrElse(Nil) :_*))
  }

  lazy val parser: BodyParser[A] = action.parser
}

object Api extends Controller with PanDomainAuthActions {

  val defaultCorsAble: Set[String] = Set(Config.composerUrl)
  val mediaAtomCorsAble: Set[String] = defaultCorsAble ++ Set(Config.mediaAtomMakerUrl, Config.mediaAtomMakerUrlForCode)

  implicit val flatStubWrites: Writes[Stub] = Stub.flatStubWrites

  def allowCORSAccess(methods: String, args: Any*) = CORSable(mediaAtomCorsAble) {
    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }

  // can be hidden behind multiple auth endpoints
  private def getContentBlock[R <: Request[_]] = { implicit req: R =>
    val qs: Map[String, Seq[String]] = req match {
      case r: UserRequest[_] => r.queryString + ("email" -> Seq(r.user.email))
      case r: Request[_] => r.queryString
    }

    val supportAtoms = req.cookies.get("support-atoms").fold(false)(cookie => cookie.value == "1")
    val queryString = if(supportAtoms) qs + ("supportAtoms" -> Seq(supportAtoms.toString)) else qs

    CommonAPI.getStubs(queryString).asFuture.map {
      case Left(err) => InternalServerError
      case Right(contentResponse) => Ok(Json.toJson(contentResponse))
    }
  }

  def content = APIAuthAction.async(getContentBlock)

  def getContentByComposerId(composerId: String) = CORSable(defaultCorsAble) {
      APIAuthAction.async { implicit request =>
        ApiResponseFt[Option[Stub]](for {
          item <- getResponse(PrototypeAPI.getStubByComposerId(composerId))
        } yield {
          item
        })(Writes.OptionWrites(Stub.flatStubWrites), defaultExecutionContext)
      }
    }

  def getContentByEditorId(editorId: String) = CORSable(mediaAtomCorsAble) {
    APIAuthAction.async { implicit request =>
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(PrototypeAPI.getStubByEditorId(editorId))
      } yield {
        item
      })(Writes.OptionWrites(Stub.flatStubWrites), defaultExecutionContext)
    }
  }

  def sharedAuthGetContentById(composerId: String) =
    SharedSecretAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(PrototypeAPI.getStubByComposerId(composerId))
      } yield {
        item
      })(Writes.OptionWrites(Stub.flatStubWrites), defaultExecutionContext)
    }

  private val iso8601DateTimeNoMillis: Mapping[DateTime] = jodaDate("yyyy-MM-dd'T'HH:mm:ssZ")

  def createContent() =  CORSable(mediaAtomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        jsValue <- ApiUtils.readJsonFromRequestResponse(request.body)
        stubId <- PrototypeAPI.createStub(jsValue)
      } yield {
        stubId
      })
    }
  }

  def putStub(stubId: Long) =  CORSable(defaultCorsAble) {
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

  def putStubNote(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubProdOffice(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubStatus(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubStatusByComposerId(composerId: String) = CORSable(defaultCorsAble) {
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

  def putStubSection(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubWorkingTitle(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubPriority(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubLegalStatus(stubId: Long) = CORSable(defaultCorsAble) {
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

  def putStubTrashed(stubId: Long) = CORSable(defaultCorsAble) {
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

  def deleteContent(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction {
      CommonAPI.deleteStubs(Seq(composerId)).fold(err =>
        Logger.error(s"failed to delete content with composer id: $composerId"), identity)
      NoContent
    }
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    PrototypeAPI.deleteContentByStubId(stubId).fold(err =>
    Logger.error(s"failed to delete content with stub id: $stubId"), identity)
    NoContent
  }

  def statusus = CORSable(defaultCorsAble)  {
    APIAuthAction.async { implicit req =>
      for(statuses <- StatusDatabase.statuses) yield {
        Ok(renderJsonResponse(statuses))
      }
    }
  }

  def sections = CORSable(mediaAtomCorsAble) {
    AuthAction.async { request =>
      ApiResponseFt[List[Section]](for {
        sections <- SectionsAPI.getSections
      } yield {
        sections
      })
    }
  }

  def editorialSupportTeams = CORSable(defaultCorsAble) {
    APIAuthAction {
      Ok(Json.toJson(EditorialSupportTeamsController.getTeams()))
    }
  }

  def addEditorialSupportStaff(name: String, team: String) = APIAuthAction {
    EditorialSupportTeamsController.createNewStaff(name, team)
    Ok(s"$name added to $team")
  }

  def toggleEditorialSupportStaff(id: String, status: String) = APIAuthAction {
    val active = status.toBoolean
    EditorialSupportTeamsController.toggleStaffStatus(id, active)
    Ok(s"Status switched to ${ if (active) "inactive" else "active" }")
  }

  def updateEditorialSupportStaffDescription(id: String, description: String) = APIAuthAction {
    EditorialSupportTeamsController.updateStaffDescription(id, description)
    Ok(s"Description updated to '$description'")
  }

  def sharedAuthGetContent = SharedSecretAuthAction.async(getContentBlock)
}
