package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.{AWSWorkflowBucket, StatusDatabase, SectionDatabase, ContentDatabase}
import models._
import models.{Status => WorkflowStatus} // Status in controller is Http status
import play.api.data.Form
import java.util.UUID
import play.api.libs.json.{Reads, Writes, Json, JsValue}
import play.api.libs.openid.OpenID
import play.api.mvc.Security.AuthenticatedBuilder

object Application extends Controller {

  import play.api.data.Forms._

  val stubForm = Form(
  mapping(
    "title" -> nonEmptyText,
    "section" -> text,
    "due" -> optional(jodaDate("dd/MM/yyyy HH:mm")),
    "assignee" -> optional(text)
  )((title, section, due, assignee) =>
       Stub((UUID.randomUUID()).toString, title, section, due, assignee)
  )(s => Some((s.title, s.section, s.due, s.assignee))))


  object Authenticated extends AuthenticatedBuilder(req => req.session.get("user").flatMap(u => User.find(u)),
                                                    req => Redirect(routes.Application.login()))

  def index = Authenticated {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def stubs = Action.async {
    AWSWorkflowBucket.readStubsFile.map { stubsContent =>
      val stubs = AWSWorkflowBucket.parseStubsJson(stubsContent)
      Ok(views.html.stubs(stubForm, stubs))
    }
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
                      if(email.endsWith("@guardian.co.uk") || email.endsWith("@theguardian.com"))
                      firstName <- attr.get("firstname")
                      lastName <- attr.get("lastname")
                     } yield User(userInfo.id, email, firstName, lastName)

      user.map {
        u => Redirect(routes.Application.content(None, None)).withSession("user" -> Json.toJson(u).toString)
      }.getOrElse(Redirect(routes.Application.login()))
    }
  }


  def content(filterBy: Option[String], filterValue: Option[String]) = Authenticated.async { req =>
    for(
      items <- ContentDatabase.store.future;
      sections <- SectionDatabase.sectionList;
      statuses <- StatusDatabase.statuses
    ) yield {
      def filterPredicate(wc: WorkflowContent): Boolean =
        (for (f <- filterBy; v <- filterValue) yield {
          f match {
            case "section" => wc.section.exists(_.name == v)
            case "status"  => StatusDatabase.find(v) == Some(wc.status)
            case _         => false // TODO input validation
          }
        }) getOrElse true

      val content = items.values.toList.filter(filterPredicate)

      if (req.headers.get(ACCEPT) == Some("application/json"))
        Ok(renderJsonResponse(content))
      else
        Ok(views.html.contentDashboard(content, sections, statuses))
    }
  }

  def renderJsonResponse(content: List[WorkflowContent]): JsValue =
    Json.obj("content" -> content)

  def newStub = Action.async { implicit request =>
    stubForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest(s"that failed ${formWithErrors}"))
      },
      stub => {
          AWSWorkflowBucket.add(stub).map {_ => Redirect(routes.Application.stubs())}
      }
    )

  }

  def fieldChange(field: String, value: String, contentId: String, user: Option[String]) = Action.async {

    val updateFunction: Either[SimpleResult, WorkflowContent => WorkflowContent] = field match {

      case "section" => Right(_.copy(section = Some(Section(value))))

      case "workingTitle" => Right(_.copy(workingTitle = Some(value)))

      case "status" => for { u<-user.toRight(BadRequest("user name not supplied")).right
                             s <- StatusDatabase.find(value).toRight(BadRequest(s"not a valid status $value")).right
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
    for (altered <- ContentDatabase.update(contentId, fun))
    yield altered.map(_ => Ok(s"Updated field $field")).getOrElse(NotFound("Could not find that content.") )

}
