package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.{AWSWorkflowBucket, Database}
import models._
import play.api.data.Form
import java.util.UUID
import play.api.libs.json.{Json, JsValue}
import com.amazonaws.services.s3.model.{ObjectMetadata, PutObjectRequest, GetObjectRequest}
import java.io.{File, ByteArrayInputStream, InputStreamReader, BufferedReader}


object Application extends Controller {

  import play.api.data.Forms._

  val stubForm = Form(
  mapping(
    "title" -> text,
    "section" -> text,
    "due" -> optional(jodaDate),
    "assignee" -> optional(text)
  )((title, section, due, assignee) =>
       Stub((UUID.randomUUID()).toString, title, section, due, assignee)
  )(s => Some((s.title, s.section, s.due, s.assignee))))

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def stubs = Action.async {
    AWSWorkflowBucket.readStubsFile.map { stubsContent =>
      val stubs = Json.parse(stubsContent).validate[List[Stub]].getOrElse(Nil)
      Ok(views.html.stubs(stubForm, stubs))
    }
  }

  def content(filterBy: Option[String], filterValue: Option[String]) = Action.async { req =>
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
        Ok(views.html.contentDashboard(content))

      }
  }

  def renderJsonResponse(content: List[WorkflowContent]): JsValue =
    Json.obj("content" -> content)

  def newStub = Action { implicit request =>
    stubForm.bindFromRequest.fold(
      formWithErrors => {
        BadRequest(s"that failed $formWithErrors")
      },
      stub => {
          AWSWorkflowBucket.add(stub)
          Redirect(routes.Application.stubs())
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
