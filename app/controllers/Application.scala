package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.Database
import models._
import play.api.data.Form
import java.util.UUID
import play.api.libs.json.{Reads, Writes, Json, JsValue}
import play.api.libs.openid.OpenID
import play.api.mvc.Security.AuthenticatedBuilder


object Application extends Controller {

  import play.api.data.Forms._

  val workFlowForm = Form(
  mapping(
    "title" -> text,
    "desk" -> text,
    "status" -> text
  )((title, desk, status)=>
        WorkflowContent(UUID.randomUUID(),
        path=None,
        workingTitle=Some(title),
        contributors=Nil,
        desk=Some(EditorDesk(desk)),
        status=WorkflowStatus.findWorkFlowStatus(status).getOrElse(WorkflowStatus.Created),
        lastModification=None,
        scheduledLaunch=None,
        stateHistory=Map.empty,
        fromFeed=false
     ))((w: WorkflowContent) => Some("tmp","tmp", "tmp"))
  )

  object Authenticated extends AuthenticatedBuilder(req => req.session.get("user").flatMap(u => User.find(u)),
                                                    req => Redirect(routes.Application.login()))

  def index = Authenticated {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def login = Action {
    Ok(views.html.login())
  }

  case class User(id: String, email: String, firstName: String, lastName: String)

  object User {
    implicit val userWrites: Writes[User] = Json.writes[User]
    implicit val userReads: Reads[User] = Json.reads[User]

    def find(u: String): Option[User] = Json.parse(u).validate[User].asOpt

  }

  def loginPost = Action.async { implicit req =>
    val openIdAttributes = Seq(
      ("email", "http://axschema.org/contact/email"),
      ("firstname", "http://axschema.org/namePerson/first"),
      ("lastname", "http://axschema.org/namePerson/last")
    )
    val googleOpenIdUrl = "https://www.google.com/accounts/o8/id"
    OpenID.redirectURL(googleOpenIdUrl, routes.Application.openIdRedirect().absoluteURL(), openIdAttributes)
    .map(Redirect(_))
  }

  def openIdRedirect = Action.async { implicit req =>
    OpenID.verifiedId.map { userInfo =>
      val attr = userInfo.attributes
      val user = for { email <- attr.get("email")
                      if(email.contains("guardian.co.uk"))
                      firstName <- attr.get("firstname")
                      lastName <- attr.get("lastname")
                     } yield User(userInfo.id, email, firstName, lastName)

      user.map {
        u => Redirect(routes.Application.content(None, None)).withSession("user" -> Json.toJson(u).toString)
      }.getOrElse(Redirect(routes.Application.login()))
    }
  }

  def content(filterBy: Option[String], filterValue: Option[String]) = Authenticated.async { req =>
    Database.store.future.map { items =>
      def filterPredicate(wc: WorkflowContent): Boolean =
        (for (f <- filterBy; v <- filterValue) yield {
          f match {
            case "desk"   => wc.desk.exists(_.name == v)
            case "status" => WorkflowStatus.findWorkFlowStatus(v.toLowerCase) == Some(wc.status)
            case _        => false // TODO input validation
          }
        }) getOrElse true

      val content = items.values.toList.filter(filterPredicate)

      if (req.headers.get(ACCEPT) == Some("application/json"))
        Ok(renderJsonResponse(content))
      else
        Ok(views.html.contentDashboard(content, workFlowForm))
    }
  }

  def renderJsonResponse(content: List[WorkflowContent]): JsValue = {
    Json.obj("content" -> Json.arr(content.map(c => Json.toJson(c))))

  }
  def newWorkFlow = Action.async { implicit request =>
    workFlowForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("that failed"))
      },
      contentItem => {
        Database.store.alter(items => items.updated(contentItem.id, contentItem)).map { _ =>
          Redirect(routes.Application.content(None, None))
        }
      }
    )
  }

  def fieldChange(field: String, value: String, contentId: String, user: Option[String]) = Action.async {

    val updateFunction: Either[SimpleResult, WorkflowContent => WorkflowContent] = field match {

      case "desk" => Right(_.copy(desk=Some(EditorDesk(value))))

      case "workingTitle" => Right(_.copy(workingTitle = Some(value)))

      case "status" => for { u<-user.toRight(BadRequest("user name not supplied")).right
                             s <- WorkflowStatus.findWorkFlowStatus(value).toRight(BadRequest(s"not a valid status $value")).right
                           } yield (wc: WorkflowContent) => wc.copy(status=s, stateHistory = wc.stateHistory.updated(s,u))


      case "launch" => Formatting.parseDate(value)
                       .map(d => (wc: WorkflowContent) => wc.copy(scheduledLaunch = Some(d)))
                       .toRight(BadRequest(s"not a valid date $value"))

      case f => Left(BadRequest(s"field '$f' doesn't exist"))
    }
    val id: Either[SimpleResult, UUID] = try { Right(UUID.fromString(contentId)) } catch {
      case e: IllegalArgumentException => Left(BadRequest(s"invalid UUID $contentId"))
    }
    (for {
      contentId <- id.right
      fun       <- updateFunction.right
    }
    yield alterContent(contentId, field, fun)).left.map(Future.successful).merge
  }

  def alterContent(contentId: UUID, field: String, fun: WorkflowContent => WorkflowContent): Future[SimpleResult] =
    for (altered <- Database.update(contentId, fun))
    yield altered.map(_ => Ok(s"Updated field $field")).getOrElse(NotFound("Could not find that content.") )

}
