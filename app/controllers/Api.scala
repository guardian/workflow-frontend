package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.workflow.api.{SectionsAPI, StubAPI}
import com.gu.workflow.lib.DBToAPIResponse.getResponse
import com.gu.workflow.lib.{ContentAPI, Priorities, StatusDatabase}
import com.gu.workflow.util.{SharedSecretAuth, StubDecorator}
import config.Config
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

import scala.concurrent.{ExecutionContext, Future}
import scala.concurrent.ExecutionContext.Implicits.global

class Api(
  stubsApi: StubAPI,
  sectionsApi: SectionsAPI,
  editorialSupportTeams: EditorialSupportTeamsController,
  override val config: Config,
  override val controllerComponents: ControllerComponents,
  override val wsClient: WSClient,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with SharedSecretAuth {

  import stubsApi.{extractDataResponse, extractDataResponseOpt, extractResponse, readJsonFromRequestResponse}

  val contentAPI = new ContentAPI(capiPreviewRole = config.capiPreviewRole, apiRoot = config.capiPreviewIamUrl, ws = wsClient)
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
    val qs: Map[String, Seq[String]] = Api.queryString(req)

    stubsApi.getStubs(stubDecorator, qs).asFuture.map {
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
          item <- getResponse(stubsApi.getStubByComposerId(stubDecorator, composerId))
        } yield item
      )}
    }

  def getContentByEditorId(editorId: String) = CORSable(atomCorsAble) {
    APIAuthAction.async { implicit request =>
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(stubsApi.getStubByEditorId(editorId))
      } yield item
    )}
  }

  def sharedAuthGetContentById(composerId: String) =
    SharedSecretAuthAction.async {
      ApiResponseFt[Option[Stub]](for {
        item <- getResponse(stubsApi.getStubByComposerId(stubDecorator, composerId))
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
        json <- readJsonFromRequestResponse(request.body)
        jsValueWithValidContentType <- validateContentType(json)
        stubId <- stubsApi.createStub(jsValueWithValidContentType)
      } yield stubId
    )}
  }

  def putStub(stubId: Long) =  CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[models.api.ContentUpdate](for {
        json <- readJsonFromRequestResponse(request.body)
        putRes <- stubsApi.putStub(stubId, json)
      } yield putRes
    )}
  }

  def putStubAssignee(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- readJsonFromRequestResponse(request.body)
      assignee <- extractDataResponse[String](json)
      assigneeData = Some(assignee).filter(_.nonEmpty)
      id <- stubsApi.putStubAssignee(stubId, assigneeData)
    } yield id
  )}

  def putStubAssigneeEmail(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- readJsonFromRequestResponse(request.body)
      assignee <- extractDataResponse[String](json)
      assigneeEmailData = Some(assignee).filter(_.nonEmpty)
      id <- stubsApi.putStubAssigneeEmail(stubId, assigneeEmailData)
    } yield id
  )}

  def putStubDueDate(stubId: Long) = APIAuthAction.async { request =>
    ApiResponseFt[Long](for {
      json <- readJsonFromRequestResponse(request.body)
      dueDateOpt <- extractDataResponseOpt[String](json)
      dueDateData = dueDateOpt.map(new DateTime(_))
      id <- stubsApi.putStubDue(stubId, dueDateData)
    } yield id
  )}

  def putStubNote(stubId: Long) = CORSable(atomCorsAble) {
    def getNoteOpt(input: String): Option[String] = if(input.length > 0) Some(input) else None
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        note <- extractDataResponse[String](json)
        noteOpt = getNoteOpt(note)
        id <- stubsApi.putStubNote(stubId, noteOpt)
      } yield id
    )}
  }

  def putStubProdOffice(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        prodOffice <- extractDataResponse[String](json)
        id <- stubsApi.putStubProdOffice(stubId, prodOffice)
      } yield id
    )}
  }

  def putStubStatus(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        status <- extractDataResponse[String](json)
        id <- stubsApi.updateContentStatus(stubId, status)
      } yield id
    )}
  }

  def putStubCommissionedLength(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        status <- extractDataResponse[Option[Int]](json)
        id <- stubsApi.updateContentCommissionedLength(stubId, status)
      } yield id
      )}
  }

  def putStubStatusByComposerId(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[String](for {
        json <- readJsonFromRequestResponse(request.body)
        status <- extractDataResponse[String](json)
        id <- stubsApi.updateContentStatusByComposerId(composerId, status)
      } yield id
    )}
  }

  def putStubSection(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        section <- extractResponse[String](json.hcursor.downField("data").downField("name").focus.getOrElse(Json.Null))
        id <- stubsApi.putStubSection(stubId, section)
      } yield id
    )}
  }

  def putStubWorkingTitle(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        wt <- extractDataResponse[String](json)
        id <- stubsApi.putStubWorkingTitle(stubId, wt)
      } yield id
    )}
  }

  def putStubPriority(stubId: Long) = CORSable(atomCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        priority <- extractDataResponse[Int](json)
        id <- stubsApi.putStubPriority(stubId, priority)
      } yield id
    )}
  }

  def putStubLegalStatus(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        status <- extractDataResponse[Flag](json)
        id <- stubsApi.putStubLegalStatus(stubId, status)
      } yield id
    )}
  }

  def putStubTrashed(stubId: Long) = CORSable(defaultCorsAble) {
    APIAuthAction.async { request =>
      ApiResponseFt[Long](for {
        json <- readJsonFromRequestResponse(request.body)
        trashed <- extractDataResponse[Boolean](json)
        id <- stubsApi.putStubTrashed(stubId, trashed)
      } yield id
    )}
  }

  def deleteContent(composerId: String) = CORSable(defaultCorsAble) {
    APIAuthAction {
      stubsApi.deleteStubs(Seq(composerId)).fold(err =>
        Logger.error(s"failed to delete content with composer id: $composerId"), identity)
      NoContent
    }
  }

  def deleteStub(stubId: Long) = APIAuthAction {
    stubsApi.deleteContentByStubId(stubId).fold(err =>
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
        sections <- sectionsApi.getSections
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

  object SharedSecretAuthAction extends ActionBuilder[Request, AnyContent] {
    override def parser: BodyParser[AnyContent] = controllerComponents.parsers.default
    override protected def executionContext: ExecutionContext = controllerComponents.executionContext

    def invokeBlock[A](req: Request[A], block: (Request[A]) => Future[Result]) =
      if(!isInOnTheSecret(req))
        Future(Results.Forbidden)
      else
        block(req)
  }
}

object Api {
  def queryString[R <: Request[_]](req: R): Map[String, Seq[String]] = req match {
    case r: UserRequest[_] => r.queryString + ("email" -> Seq(r.user.email))
    case r: Request[_] => r.queryString
  }
}
