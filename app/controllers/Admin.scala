package controllers

import com.gu.workflow.db.{CommonDB, DeskDB, SectionDB, SectionDeskMappingDB}
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json.{JsError, Reads, JsValue, JsResult, JsSuccess}
import play.api.libs.ws.WS

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import play.api.mvc._
import play.api.data.Form

import lib._
import models.{Status => WorkflowStatus, WorkflowContent, ContentUpdateEvent, Section, Desk}

import scala.util.{Failure, Success}

object Admin extends Controller with PanDomainAuthActions {

  import play.api.data.Forms._

  def index(selectedDeskIdOption: Option[Long]) = (AuthAction andThen WhiteListAuthFilter) {

    val deskList = DeskDB.deskList

    val selectedDeskOption = for {
      selectedDeskId <- selectedDeskIdOption
      selectedDesk <- deskList.find((desk) => selectedDeskId == desk.id)
    } yield {
      selectedDesk
    }

    val desks = selectedDeskOption.map { selectedDesk =>
      deskList.map { desk =>
        if(desk.id==selectedDesk.id)
          desk.copy(name=desk.name, selected=true)
        else
          desk
      }
    }.getOrElse(deskList)

    val sectionList = selectedDeskOption.map { selectedDesk =>
      SectionDeskMappingDB.getSectionsWithRelation(selectedDesk)
    }.getOrElse(SectionDB.sectionList)

    Ok(
      views.html.adminConsole(
        sectionList.sortBy(_.name),
        addSectionForm,
        desks.sortBy(_.name),
        addDeskForm,
        selectedDeskOption)
    )
  }

  def syncComposer = Action {
    val visibleContent = PostgresDB.getContent()
    Ok(views.html.syncComposer(visibleContent.size))
  }


  def syncComposerPost = Action { req =>
    val visibleContent = PostgresDB.getContent()
    val contentIds = visibleContent.map(_.wc.composerId)
    val composerDomain = PrototypeConfiguration.cached.composerUrl
    val composerUrl = composerDomain + "/api/content/"
    val cookie = req.headers.get("Cookie").getOrElse("")

    import play.api.Play.current
    Logger.info(s"updating ${contentIds.size}")
    def recursiveCallComposer(contentIds: List[String]): Unit = contentIds match {
      case contentId :: tail => {
        Logger.info(s"updating a contentId with ${contentId}")
        WS.url(composerUrl + contentId + "?includePreview=true").withHeaders(("Cookie", cookie)).get() onComplete {
          case Success(res) if (res.status == 200) => {
            ContentUpdateEvent.readFromApi(res.json) match {
              case JsSuccess(content, _) =>  {
                CommonDB.createOrModifyContent(WorkflowContent.fromContentUpdateEvent(content), content.revision)
              }
              case JsError(error) => Logger.error(s"error parsing composer api ${error} with contentId ${contentId}")
            }
            recursiveCallComposer(tail)
          }
          case Success(res) => {
            Logger.error(s"received status ${res.status} from composer for content item ${contentId}")
            recursiveCallComposer(tail)
          }
          case Failure(error) => {
            Logger.error(s"error calling composer api ${error} with contentId ${contentId}")
            recursiveCallComposer(tail)
          }
        }

      }
      case Nil => ()
    }
    recursiveCallComposer(contentIds)
    Redirect("/admin/syncComposer")
  }


  val addSectionForm = Form(
    mapping(
      "name" -> nonEmptyText,
      "selected" -> boolean,
      "id" -> longNumber
    )(Section.apply)(Section.unapply)
  )

  val addDeskForm = Form(
    mapping(
      "name" -> nonEmptyText,
      "selected" -> boolean,
      "id" -> longNumber
    )(Desk.apply)(Desk.unapply)
  )

  case class assignSectionToDeskFormData(desk: Long, sections: List[String])

  val assignSectionToDeskForm = Form(
    mapping(
      "desk" -> longNumber,
      "sections" -> list(text)
    )(assignSectionToDeskFormData.apply)(assignSectionToDeskFormData.unapply)
  )

  def assignSectionToDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    assignSectionToDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to update section assignments"),
      sectionAssignment => {
        SectionDeskMappingDB.assignSectionsToDesk(sectionAssignment.desk, sectionAssignment.sections.map(id => id.toLong))
        Redirect(routes.Admin.index(Some(sectionAssignment.desk)))
      }
    )
  }

  /*
    SECTION routes
   */

  def addSection = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to add section"),
      section => {
        SectionDB.upsert(section)
        Redirect(routes.Admin.index(None))
      }
    )
  }

  def removeSection = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addSectionForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove section"),
      section => {
        SectionDeskMappingDB.removeSectionMappings(section)
        SectionDB.remove(section)
        NoContent
      }
    )
  }

  /*
    DESK routes
   */

  def addDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to add desk ${formWithErrors.errors}"),
      desk => {
        DeskDB.upsert(desk)
        Redirect(routes.Admin.index(None))
      }
    )
  }

  def removeDesk = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addDeskForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove desk"),
      desk => {
        SectionDeskMappingDB.removeDeskMappings(desk)
        DeskDB.remove(desk)
        NoContent
      }
    )
  }

  val statusForm = Form(
    mapping(
      "name" -> nonEmptyText
    )(WorkflowStatus.apply)(WorkflowStatus.unapply)
  )

  def status = (AuthAction andThen WhiteListAuthFilter).async {
    for (statuses <- StatusDatabase.statuses) yield Ok(views.html.status(statuses, statusForm))
  }

  def addStatus = processStatusUpdate("failed to add status") { status =>
    StatusDatabase.add(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def removeStatus = processStatusUpdate("failed to remove status") { status =>
    StatusDatabase.remove(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def moveStatusUp = processStatusUpdate("failed to move status") { status =>
    StatusDatabase.moveUp(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def moveStatusDown = processStatusUpdate("failed to move status") { status =>
    StatusDatabase.moveDown(status).map{ _ =>
      Redirect(routes.Admin.status)
    }
  }

  def processStatusUpdate(error: String)(block: WorkflowStatus => Future[Result]) = 
    (AuthAction andThen WhiteListAuthFilter).async { implicit request =>

    statusForm.bindFromRequest.fold(
      formWithErrors => {
        Future.successful(BadRequest(error))
      },
      block
    )
  }
}
