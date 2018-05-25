package controllers

import cats.syntax.either._
import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.api.{ApiUtils, CommonAPI, PrototypeAPI, SectionsAPI}
import com.gu.workflow.lib.DBToAPIResponse.getResponse
import com.gu.workflow.lib._
import config.Config
import config.Config.defaultExecutionContext
import io.circe.syntax._
import io.circe.{Encoder, Json}
import lib.Responses._
import models.api.{ApiError, ApiResponseFt}
import models.{Flag, _}
import org.joda.time.DateTime
import play.api.Logger
import play.api.mvc._
import EditorialSupportStaff._

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
  val atomCorsAble: Set[String] = defaultCorsAble ++ Config.mediaAtomMakerUrls ++ Config.atomWorkshopUrls

  implicit val flatStubWrites: Encoder[Stub] = Stub.flatJsonEncoder

  def allowCORSAccess(methods: String, args: Any*) = CORSable(atomCorsAble) {
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

    CommonAPI.getStubs(qs).asFuture.map {
      case Left(_) => InternalServerError
      case Right(contentResponse) => Ok(contentResponse.asJson.noSpaces)
    }
  }

  def content = APIAuthAction.async(getContentBlock)

  def getContentByComposerId(composerId: String) = CORSable(defaultCorsAble) {
      APIAuthAction.async { implicit request =>
        ApiResponseFt[Option[Stub]](for {
          item <- getResponse(PrototypeAPI.getStubByComposerId(composerId))
        } yield item
      )}
    }

  def getContentByEditorId(editorId: String) = CORSable(atomCorsAble) {
    APIAuthAction.async { implicit request =>
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(PrototypeAPI.getStubByEditorId(editorId))
      } yield item
    )}
  }

  def sharedAuthGetContentById(composerId: String) =
    SharedSecretAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(PrototypeAPI.getStubByComposerId(composerId))
      } yield item
    )}

  def validateContentType(body: Json): ApiResponseFt[Json] = {
    val atomType: String = body.hcursor.downField("contentType").as[String].getOrElse("")
    val allTypes: List[String] = Config.atomTypes ++ Config.contentTypes
    if (allTypes.contains(atomType)) {
      ApiResponseFt.Right(body)
    } else {
      ApiResponseFt.Left(ApiError("InvalidAtomType", s"atoms with type $atomType not supported", 400, "badrequest"))
    }
  }


  def createContent() =  CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        jsValueWithValidContentType <- validateContentType(json)
        stubId <- PrototypeAPI.createStub(jsValueWithValidContentType)
      } yield stubId
    )}
  }

  def putStub(stubId: Long) =  CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        putRes <- PrototypeAPI.putStub(stubId, json)
      } yield putRes
    )}
  }

  def putStubAssignee(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      assignee <- ApiUtils.extractDataResponse[String](json)
      assigneeData = Some(assignee).filter(_.nonEmpty)
      id <- PrototypeAPI.putStubAssignee(stubId, assigneeData)
    } yield id
  )}

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      assignee <- ApiUtils.extractDataResponse[String](json)
      assigneeEmailData = Some(assignee).filter(_.nonEmpty)
      id <- PrototypeAPI.putStubAssigneeEmail(stubId, assigneeEmailData)
    } yield id
  )}

  def putStubDueDate(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- ApiUtils.readJsonFromRequestResponse(request.body)
      dueDateOpt <- ApiUtils.extractDataResponseOpt[String](json)
      dueDateData = dueDateOpt.map(new DateTime(_))
      id <- PrototypeAPI.putStubDue(stubId, dueDateData)
    } yield id
  )}

  def putStubNote(stubId: Long) = CORSable(atomCorsAble) {
    def getNoteOpt(input: String): Option[String] = if(input.length > 0) Some(input) else None
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        note <- ApiUtils.extractDataResponse[String](json)
        noteOpt = getNoteOpt(note)
        id <- PrototypeAPI.putStubNote(stubId, noteOpt)
      } yield id
    )}
  }

  def putStubProdOffice(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        prodOffice <- ApiUtils.extractDataResponse[String](json)
        id <- PrototypeAPI.putStubProdOffice(stubId, prodOffice)
      } yield id
    )}
  }

  def putStubStatus(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[String](json)
        id <- PrototypeAPI.updateContentStatus(stubId, status)
      } yield id
    )}
  }

  def putStubCommissionedLength(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[Option[Int]](json)
        id <- PrototypeAPI.updateContentCommissionedLength(stubId, status)
      } yield id
      )}
  }

  def putStubStatusByComposerId(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[String](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[String](json)
        id <- PrototypeAPI.updateContentStatusByComposerId(composerId, status)
      } yield id
    )}
  }

  def putStubSection(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        section <- ApiUtils.extractResponse[String](json.hcursor.downField("data").downField("name").focus.getOrElse(Json.Null))
        id <- PrototypeAPI.putStubSection(stubId, section)
      } yield id
    )}
  }

  def putStubWorkingTitle(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        wt <- ApiUtils.extractDataResponse[String](json)
        id <- PrototypeAPI.putStubWorkingTitle(stubId, wt)
      } yield id
    )}
  }

  def putStubPriority(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        priority <- ApiUtils.extractDataResponse[Int](json)
        id <- PrototypeAPI.putStubPriority(stubId, priority)
      } yield id
    )}
  }

  def putStubLegalStatus(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        status <- ApiUtils.extractDataResponse[Flag](json)
        id <- PrototypeAPI.putStubLegalStatus(stubId, status)
      } yield id
    )}
  }

  def putStubTrashed(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- ApiUtils.readJsonFromRequestResponse(request.body)
        trashed <- ApiUtils.extractDataResponse[Boolean](json)
        id <- PrototypeAPI.putStubTrashed(stubId, trashed)
      } yield id
    )}
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

  def statusus = CORSable(atomCorsAble)  {
    APIAuthAction.async { implicit req =>
      for(statuses <- StatusDatabase.statuses) yield {
        Ok(renderJsonResponse(statuses).asJson.noSpaces)
      }
    }
  }

  def sections = CORSable(atomCorsAble) {
    AuthAction.async { _ =>
      ApiResponseFt[List[Section]](for {
        sections <- SectionsAPI.getSections
      } yield sections
    )}
  }

  def allowedAtomTypes = CORSable(atomCorsAble) {
    AuthAction {
      Ok(Config.atomTypes.asJson.noSpaces)
    }
  }

  def editorialSupportTeams = CORSable(defaultCorsAble) {
    APIAuthAction {
      val staff = EditorialSupportTeamsController.listStaff().filter(_.name.nonEmpty)
      val teams = EditorialSupportStaff.groupByTeams(staff)

      val fronts = EditorialSupportStaff.groupByPerson(EditorialSupportStaff.getTeam("Fronts", teams))
      val other = teams.filterNot(_.name == "Fronts")

      Ok((other :+ fronts).asJson.noSpaces)
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction.async(getContentBlock)
}
