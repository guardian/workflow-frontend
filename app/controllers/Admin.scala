package controllers

import com.gu.workflow.db._
import com.gu.workflow.lib.StatusDatabase
import lib._
import Response._
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.mvc._
import play.api.data.Form
import lib._
import models.{Status => WorkflowStatus, _}
import scala.util.{Failure, Success}

object Admin extends Controller with PanDomainAuthActions {

  import play.api.data.Forms._

  def index() = (AuthAction andThen WhiteListAuthFilter) {

    Redirect("/admin/desks-and-sections")
  }

  def desksAndSections(selectedDeskIdOption: Option[Long]) = (AuthAction andThen WhiteListAuthFilter) {

    val deskList = DeskDB.deskList

    val selectedDeskOption = for {
      selectedDeskId <- selectedDeskIdOption
      selectedDesk <- deskList.find((desk) => selectedDeskId == desk.id)
    } yield {
      selectedDesk
    }

    val desks = selectedDeskOption.map { selectedDesk =>
      deskList.map { desk =>
        if (desk.id == selectedDesk.id)
          desk.copy(name = desk.name, selected = true)
        else
          desk
      }
    }.getOrElse(deskList)

    val sectionList = selectedDeskOption.map { selectedDesk =>
      SectionDeskMappingDB.getSectionsWithRelation(selectedDesk)
    }.getOrElse(SectionDB.sectionList)

    Ok(
      views.html.admin.desksAndSections(
        sectionList.sortBy(_.name),
        addSectionForm,
        desks.sortBy(_.name),
        addDeskForm,
        selectedDeskOption)
    )
  }

  def newsLists = (AuthAction andThen WhiteListAuthFilter) {
    Ok(views.html.admin.newsLists(NewsListDB.newsListList.sortBy(newsList => newsList.title), addNewsListForm, SectionDB.sectionList))
  }

  def syncComposer = (AuthAction andThen WhiteListAuthFilter) {
    val visibleContent = PostgresDB.getContent()
    Ok(views.html.syncComposer(visibleContent.size))
  }


  def syncComposerPost = (AuthAction andThen WhiteListAuthFilter) { req =>
    val visibleContent = PostgresDB.getContent()
    val contentIds = visibleContent.map(_.wc.composerId)
    val composerDomain = PrototypeConfiguration.cached.composerUrl
    val composerUrl = composerDomain + "/api/content/"
    val cookie = req.headers.get("Cookie").getOrElse("")

    import play.api.Play.current
    Logger.info(s"updating ${contentIds.size}")
    def recursiveCallComposer(contentIds: List[String]): Unit = contentIds match {
      case contentId :: tail => {
        Logger.info(s"updating $contentId")

        WS.url(composerUrl + contentId + "?includePreview=true").withHeaders(("Cookie", cookie)).get() onComplete {
          case Success(res) if (res.status == 200) => {
            CommonDB.getContentForComposerId(contentId).map { wfContent =>
              ContentUpdateEvent.readFromApi(res.json, wfContent) match {
                case JsSuccess(contentEvent, _) =>  {
                  Logger.info(s"published: ${contentEvent.published} @ ${contentEvent.publicationDate} (revision: ${contentEvent.revision})")
                  CommonDB.updateContentFromUpdateEvent(contentEvent)
                }
                case JsError(error) => Logger.error(s"error parsing composer api ${error} with contentId ${contentId}")
              }
              recursiveCallComposer(tail)
            }

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
        Redirect(routes.Admin.desksAndSections(Some(sectionAssignment.desk)))
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
        Redirect(routes.Admin.desksAndSections(None))
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
        Redirect(routes.Admin.desksAndSections(None))
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

  /*
  NEWSLIST routes
 */

  val addNewsListForm = Form(
    mapping(
      "title" -> text,
      "id" -> longNumber,
      "default_section" -> longNumber
    )(NewsList.apply)(NewsList.unapply)
  )

  def addNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to add news list ${formWithErrors.errors}"),
      newsList => {
        NewsListDB.upsert(newsList)
        Redirect(routes.Admin.newsLists())
      }
    )
  }

  def updateNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest(s"failed to update news list ${formWithErrors.errors}"),
      newsList => {
        NewsListDB.update(newsList)
        Redirect(routes.Admin.newsLists())
      }
    )
  }

  def removeNewsList = (AuthAction andThen WhiteListAuthFilter) { implicit request =>
    addNewsListForm.bindFromRequest.fold(
      formWithErrors => BadRequest("failed to remove news list"),
      newsList => {
        NewsListDB.remove(newsList)
        NoContent
      }
    )
  }

}
