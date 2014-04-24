package controllers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import lib.Database
import models._
import play.api.data.Form
import java.util.UUID


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

  def index = Action {
    Ok(views.html.index("Hello wor... kflow :)"))
  }

  def content = Action.async {
    Database.store.future.map(items => {
      val workFlowContent = items.values.toList
      Ok(views.html.contentDashboard(workFlowContent, workFlowForm))
    })
  }

  def newWorkFlow = Action.async { implicit request =>
    workFlowForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest("that failed"))
      },
      contentItem => {
        Database.store.alter(items => items.updated(contentItem.id, contentItem)).map { _ =>
          Redirect(routes.Application.content)
        }
      }
    )
  }

  type AsyncResult = Future[SimpleResult]

  def fieldChange(field: String, value: String, contentId: String, user: Option[String]) = Action.async {
    val updateFunction: Either[SimpleResult, WorkflowContent => WorkflowContent] = field match {
      case "desk" => Right(_.copy(desk=Some(EditorDesk(value))))
      case "workingTitle" => Right(_.copy(workingTitle = Some(value)))
      case "status" => WorkflowStatus.findWorkFlowStatus(value)
        .map(s => (wc: WorkflowContent) => wc.copy(status = s))
        .toRight(BadRequest("bad"))
      case f => Left(BadRequest(s"field '$f' doesn't exist"))
    }
    updateFunction
      .right.map(f =>
        for (altered <- Database.update(UUID.fromString(contentId), f))
        yield altered.map(_ => Ok(s"Updated field $field")).getOrElse(NotFound("Could not find that content.") )
      )
      .left.map(r=> Future.successful(r))
      .merge

  }

}
