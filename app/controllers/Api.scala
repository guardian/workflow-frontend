package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.api.{ApiUtils, SectionsAPI, StubAPI}
import com.gu.workflow.lib.DBToAPIResponse.getResponse
import com.gu.workflow.lib.{ContentAPI, Priorities, StatusDatabase}
import com.gu.workflow.util.{SharedSecretAuth, StubDecorator}
import config.Config
import config.Config.defaultExecutionContext
import io.circe.syntax._
import io.circe.{Encoder, Json}
import lib.CORSable
import lib.Responses._
import models.EditorialSupportStaff._
import models.api.{ApiError, ApiResponseFt}
import models.{Flag, _}
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.Future

class Api(
  val apiUtils: ApiUtils,
  val editorialSupportTeams: EditorialSupportTeamsController,
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with SharedSecretAuth {

  val contentAPI = new ContentAPI(config.capiPreviewRole, config.capiPreviewIamUrl)
  val stubDecorator = new StubDecorator(contentAPI)

  val defaultCorsAble: Set[String] = Set(config.composerUrl)
  val atomCorsAble: Set[String] = defaultCorsAble ++ config.mediaAtomMakerUrls ++ config.atomWorkshopUrls

  override def secret: String = config.sharedSecret

  implicit val flatStubWrites: Encoder[Stub] = Stub.flatJsonEncoder

  def allowCORSAccess(methods: String, args: Any*) = CORSable(atomCorsAble) {
    Action { implicit req =>
      val requestedHeaders = req.headers("Access-Control-Request-Headers")
      NoContent.withHeaders("Access-Control-Allow-Methods" -> methods, "Access-Control-Allow-Headers" -> requestedHeaders)
    }
  }

  // can be hidden behind multiple auth endpoints
  private def getContentBlock[R <: Request[_]] = { implicit req: R =>
    val qs: Map[String, Seq[String]] = queryString(req)

    StubAPI.getStubs(stubDecorator, qs).asFuture.map {
      case Left(err) =>
        Logger.error(s"Unable to get stubs $err")
        InternalServerError

      case Right(contentResponse) =>
        Ok(contentResponse.asJson.noSpaces)
    }
  }

  def content = APIAuthAction.async(getContentBlock)

  def getContentByComposerId(composerId: String) = CORSable(defaultCorsAble) {
      APIAuthAction.async { implicit request =>
        ApiResponseFt[Option[Stub]](for {
          item <- getResponse(StubAPI.getStubByComposerId(stubDecorator, composerId))
        } yield item
      )}
    }

  def getContentByEditorId(editorId: String) = CORSable(atomCorsAble) {
    APIAuthAction.async { implicit request =>
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(StubAPI.getStubByEditorId(editorId))
      } yield item
    )}
  }

  def sharedAuthGetContentById(composerId: String) =
    SharedSecretAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(StubAPI.getStubByComposerId(stubDecorator, composerId))
      } yield item
      )}

  def validateContentType(body: Json): ApiResponseFt[Json] = {
    val atomType: String = body.hcursor.downField("contentType").as[String].getOrElse("")
    val allTypes: List[String] = config.atomTypes ++ config.contentTypes
    if (allTypes.contains(atomType)) {
      ApiResponseFt.Right(body)
    } else {
      ApiResponseFt.Left(ApiError("InvalidAtomType", s"atoms with type $atomType not supported", 400, "badrequest"))
    }
  }


  def createContent() =  CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        jsValueWithValidContentType <- validateContentType(json)
        stubId <- StubAPI.createStub(jsValueWithValidContentType)
      } yield stubId
    )}
  }

  def putStub(stubId: Long) =  CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        putRes <- StubAPI.putStub(stubId, json)
      } yield putRes
    )}
  }

  def putStubAssignee(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- apiUtils.readJsonFromRequestResponse(request.body)
      assignee <- apiUtils.extractDataResponse[String](json)
      assigneeData = Some(assignee).filter(_.nonEmpty)
      id <- StubAPI.putStubAssignee(stubId, assigneeData)
    } yield id
  )}

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- apiUtils.readJsonFromRequestResponse(request.body)
      assignee <- apiUtils.extractDataResponse[String](json)
      assigneeEmailData = Some(assignee).filter(_.nonEmpty)
      id <- StubAPI.putStubAssigneeEmail(stubId, assigneeEmailData)
    } yield id
  )}

  def putStubDueDate(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- apiUtils.readJsonFromRequestResponse(request.body)
      dueDateOpt <- apiUtils.extractDataResponseOpt[String](json)
      dueDateData = dueDateOpt.map(new DateTime(_))
      id <- StubAPI.putStubDue(stubId, dueDateData)
    } yield id
  )}

  def putStubNote(stubId: Long) = CORSable(atomCorsAble) {
    def getNoteOpt(input: String): Option[String] = if(input.length > 0) Some(input) else None
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        note <- apiUtils.extractDataResponse[String](json)
        noteOpt = getNoteOpt(note)
        id <- StubAPI.putStubNote(stubId, noteOpt)
      } yield id
    )}
  }

  def putStubProdOffice(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        prodOffice <- apiUtils.extractDataResponse[String](json)
        id <- StubAPI.putStubProdOffice(stubId, prodOffice)
      } yield id
    )}
  }

  def putStubStatus(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        status <- apiUtils.extractDataResponse[String](json)
        id <- StubAPI.updateContentStatus(stubId, status)
      } yield id
    )}
  }

  def putStubCommissionedLength(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        status <- apiUtils.extractDataResponse[Option[Int]](json)
        id <- StubAPI.updateContentCommissionedLength(stubId, status)
      } yield id
      )}
  }

  def putStubStatusByComposerId(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[String](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        status <- apiUtils.extractDataResponse[String](json)
        id <- StubAPI.updateContentStatusByComposerId(composerId, status)
      } yield id
    )}
  }

  def putStubSection(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        section <- apiUtils.extractResponse[String](json.hcursor.downField("data").downField("name").focus.getOrElse(Json.Null))
        id <- StubAPI.putStubSection(stubId, section)
      } yield id
    )}
  }

  def putStubWorkingTitle(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        wt <- apiUtils.extractDataResponse[String](json)
        id <- StubAPI.putStubWorkingTitle(stubId, wt)
      } yield id
    )}
  }

  def putStubPriority(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        priority <- apiUtils.extractDataResponse[Int](json)
        id <- StubAPI.putStubPriority(stubId, priority)
      } yield id
    )}
  }

  def putStubLegalStatus(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        status <- apiUtils.extractDataResponse[Flag](json)
        id <- StubAPI.putStubLegalStatus(stubId, status)
      } yield id
    )}
  }

  def putStubTrashed(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- apiUtils.readJsonFromRequestResponse(request.body)
        trashed <- apiUtils.extractDataResponse[Boolean](json)
        id <- StubAPI.putStubTrashed(stubId, trashed)
      } yield id
    )}
  }

  def deleteContent(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction {
      StubAPI.deleteStubs(Seq(composerId)).fold(err =>
        Logger.error(s"failed to delete content with composer id: $composerId"), identity)
      NoContent
    }
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    StubAPI.deleteContentByStubId(stubId).fold(err =>
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
    APIAuthAction.async { _ =>
      ApiResponseFt[List[Section]](for {
        sections <- SectionsAPI.getSections
      } yield sections
    )}
  }

  def allowedAtomTypes = CORSable(atomCorsAble) {
    APIAuthAction {
      Ok(config.atomTypes.asJson.noSpaces)
    }
  }

  def priorities = CORSable(atomCorsAble) {
    APIAuthAction {
      Ok(Priorities.all.asJson.noSpaces)
    }
  }

  def editorialSupportTeams = CORSable(defaultCorsAble) {
    APIAuthAction {
      val staff = editorialSupportTeams.listStaff().filter(_.name.nonEmpty)
      val teams = EditorialSupportStaff.groupByTeams(staff)

      val fronts = EditorialSupportStaff.groupByPerson(EditorialSupportStaff.getTeam("Fronts", teams))
      val other = teams.filterNot(_.name == "Fronts")

      Ok((other :+ fronts).asJson.noSpaces)
    }
  }

  def sharedAuthGetContent = SharedSecretAuthAction.async(getContentBlock)

  def queryString[R <: Request[_]](req: R): Map[String, Seq[String]] = req match {
    case r: UserRequest[_] => r.queryString + ("email" -> Seq(r.user.email))
    case r: Request[_] => r.queryString
  }

  object SharedSecretAuthAction extends ActionBuilder[Request] {
    def invokeBlock[A](req: Request[A], block: (Request[A]) => Future[Result]) =
      if(!isInOnTheSecret(req))
        Future(Results.Forbidden)
      else
        block(req)
  }
}
