package models

import models.Status._
import com.gu.workflow.db.Schema
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._
import scala.slick.driver.PostgresDriver.simple._
import com.github.tototoshi.slick.PostgresJodaSupport._
import org.joda.time._

import scala.slick.collection.heterogenous._
import syntax._

case class Asset(assetType: String, mimeType:String, url:String, fields: Map[String, String])
object Asset {
  def getImageAssetSize(asset: Asset): Option[Long] = {
       for {
        width <- asset.fields.get("width")
        height <- asset.fields.get("height")
      } yield (width.toLong) * (height.toLong)
  }

  def getImageAssetUrl(assets: List[Asset]): Option[String] = {
    val imageAssets = assets.filter(_.assetType == "image")
    val smallestAsset = imageAssets.reduceLeft((l,r) =>
        if(getImageAssetSize(l).get < getImageAssetSize(r).get){ l } else { r })

    Some(smallestAsset.url)
  }
}

case class Tag(id: Long, isLead: Boolean, section: Section)
case class Element(elementType: String, fields: Map[String, String], assets: List[Asset])
case class Block(id: String, lastModified: DateTime, elements: List[Element])
case class Thumbnail(fields: Map[String, String], assets: List[Asset])

case class WorkflowContentMainMedia(
  mediaType: Option[String] = None,
  url: Option[String]       = None,
  caption: Option[String]   = None,
  altText: Option[String]   = None
)

object WorkflowContentMainMedia {
  implicit val workFlowContentMainMediaWrites: Writes[WorkflowContentMainMedia] =
    Json.writes[WorkflowContentMainMedia]

  implicit val workFlowContentMainMedia: Reads[WorkflowContentMainMedia] =
    Json.reads[WorkflowContentMainMedia]

  def getMainMedia(blockOption: Option[Block]) = {
    blockOption.map { block =>
      WorkflowContentMainMedia(
        getMainMediaType(block),
        getMainMediaUrl(block),
        getMainMediaField("caption", block),
        getMainMediaField("alt", block)
      )
    }
  }

  def getMainMediaType(block: Block) = {
    for {
      element <- block.elements.headOption
    } yield element.elementType
  }

  def getMainMediaUrl(block: Block): Option[String] = {
    getMainMediaType(block) match {
      case Some("image") => for {
        element <- block.elements.headOption
        mainMediaUrlOption = Asset.getImageAssetUrl(element.assets)
        mainMediaUrl <- mainMediaUrlOption
      } yield mainMediaUrl
      case _ => None
    }
  }

  def getMainMediaField(field: String, block: Block): Option[String] = {
    for {
      element <- block.elements.headOption
      field <- element.fields.get(field)
    } yield field
  }
}

case class LaunchScheduleDetails(
  scheduledLaunchDate: Option[DateTime],
  embargoedUntil: Option[DateTime],
  embargoedIndefinitely: Boolean
)

object LaunchScheduleDetails {
  implicit val launchScheduleDetailsWrites: Writes[LaunchScheduleDetails] =
    Json.writes[LaunchScheduleDetails]

  implicit val launchScheduleDetailsReads: Reads[LaunchScheduleDetails] =
    ((__ \ "scheduledLaunchDate").readNullable[DateTime] ~
     (__ \ "settings" \ "embargoedUntil").readNullable[String].map(s => s.map(t => new DateTime(t))) ~
     (__ \ "settings" \ "embargoedIndefinitely").readNullable[String].map(s => s.exists(_=="true"))
    )(LaunchScheduleDetails.apply _)
}

case class WorkflowContent(
  composerId: String,
  path: Option[String],
  headline: Option[String],
  standfirst: Option[String],
  trailtext: Option[String],
  mainMedia: Option[WorkflowContentMainMedia],
  trailImageUrl: Option[String],
  contentType: String,
  section: Option[Section],
  status: Status,
  lastModified: DateTime,
  lastModifiedBy: Option[String],
  commentable: Boolean,
  published: Boolean,
  timePublished: Option[DateTime],
  storyBundleId: Option[String],
  activeInInCopy: Boolean,
  takenDown: Boolean,
  timeTakenDown: Option[DateTime],
  wordCount: Int,
  launchScheduleDetails: Option[LaunchScheduleDetails]
)

object WorkflowContent {
  implicit val dateTimeFormat = DateFormat

  def getTrailImageUrl(thumbnail: Option[Thumbnail]): Option[String] = {
    for {
      t <- thumbnail
      urlOption <- Asset.getImageAssetUrl(t.assets)
    } yield urlOption
  }

  def getSectionFromTags(tagsOption: Option[List[Tag]]): Option[Section] = {
    for {
      tags <- tagsOption
      tag <- tags.headOption
    } yield tag.section
  }

  def default(composerId: String, contentType: String = "article", activeInInCopy: Boolean = false): WorkflowContent = {
    WorkflowContent(
      composerId,
      path                  = None,
      headline              = None,
      standfirst            = None,
      trailtext             = None,
      mainMedia             = None,
      trailImageUrl         = None,
      contentType           = contentType,
      section               = None,
      status                = Status.Writers,
      lastModified          = new DateTime,
      lastModifiedBy        = None,
      commentable           = false,
      published             = false,
      timePublished         = None,
      storyBundleId         = None,
      activeInInCopy        = activeInInCopy,
      takenDown             = false,
      timeTakenDown         = None,
      wordCount             = 0,
      launchScheduleDetails = None
    )
  }

  //implemented to work on DB object and model object
  def visibleOnUi(wc: WorkflowContent) = {
    !(wc.published && wc.lastModified.isBefore(DateTime.now().minusHours(24)) && wc.status.name == "Final")
  }

  def visibleOnUi(c: Schema.DBContent) = {
    !(c.published && c.lastModified <  DateTime.now().minusHours(24) && c.status === "Final")
  }
  def fromContentRow(row: Schema.ContentRow): WorkflowContent = row match {
    case (composerId          ::
        path                  ::
        lastMod               ::
        lastModBy             ::
        status                ::
        contentType           ::
        commentable           ::
        headline              ::
        standfirst            ::
        trailtext             ::
        mainMedia             ::
        mainMediaUrl          ::
        mainMediaCaption      ::
        mainMediaAltText      ::
        trailImageUrl         ::
        published             ::
        timePublished         ::
        _                     ::
        storyBundleId         ::
        activeInInCopy        ::
        takenDown             ::
        timeTakenDown         ::
        wordCount             ::
        embargoedUntil        ::
        embargoedIndefinitely ::
        scheduledLaunchDate   ::
        HNil) => {

      val media = WorkflowContentMainMedia(
        mainMedia, mainMediaUrl, mainMediaCaption, mainMediaAltText)

      val launchScheduleDetails = LaunchScheduleDetails(
        scheduledLaunchDate,
        embargoedUntil,
        embargoedIndefinitely
      )

      WorkflowContent(
        composerId,
        path,
        headline,
        standfirst,
        trailtext,
        Some(media),
        trailImageUrl,
        contentType,
        None,
        Status(status),
        lastMod,
        lastModBy,
        commentable,
        published,
        timePublished,
        storyBundleId,
        activeInInCopy,
        takenDown,
        timeTakenDown,
        wordCount,
        Some(launchScheduleDetails)
      )
    }
  }

  def fromOptionalContentRow(row: Schema.OptionContentRow): Option[WorkflowContent] = row match {
    case (Some(composerId)      ::
          path                  ::
          Some(lastMod)         ::
          lastModBy             ::
          Some(status)          ::
          Some(contentType)     ::
          Some(commentable)     ::
          headline              ::
          standfirst            ::
          trailtext             ::
          mainMedia             ::
          mainMediaUrl          ::
          mainMediaCaption      ::
          mainMediaAltText      ::
          trailImageUrl         ::
          Some(published)       ::
          timePublished         ::
          revision              ::
          storyBundleId         ::
          Some(activeInInCopy)   ::
          Some(takenDown)        ::
          timeTakenDown           ::
          Some(wordCount)        ::
          HNil) => {

      val media = WorkflowContentMainMedia(
        mainMedia, mainMediaUrl, mainMediaCaption, mainMediaAltText)

      Some(WorkflowContent(
        composerId, path, headline,
        standfirst, trailtext, Some(media),
        trailImageUrl, contentType, None,
        Status(status), lastMod, lastModBy, commentable,
        published, timePublished, storyBundleId,
        activeInInCopy, takenDown, timeTakenDown, wordCount))
    }
    case _ => None

  }

  def newContentRow(wc: WorkflowContent, revision: Option[Long]) = {

    val mainMedia = wc.mainMedia.getOrElse(
      WorkflowContentMainMedia(None, None, None, None)
    )

    val launchScheduleDetails = wc.launchScheduleDetails.getOrElse(
      LaunchScheduleDetails(None, None, false)
    )

    wc.composerId            ::
    wc.path                  ::
    wc.lastModified          ::
    wc.lastModifiedBy        ::
    wc.status.name           ::
    wc.contentType           ::
    wc.commentable           ::
    wc.headline              ::
    wc.standfirst            ::
    wc.trailtext             ::
    mainMedia.mediaType      ::
    mainMedia.url            ::
    mainMedia.caption        ::
    mainMedia.altText        ::
    wc.trailImageUrl         ::
    wc.published             ::
    wc.timePublished         ::
    revision                 ::
    wc.storyBundleId         ::
    wc.activeInInCopy        ::
    wc.takenDown             ::
    wc.timeTakenDown         ::
    wc.wordCount             ::
    launchScheduleDetails.embargoedUntil        ::
    launchScheduleDetails.embargoedIndefinitely ::
    launchScheduleDetails.scheduledLaunchDate   ::
    HNil
  }

  implicit val workFlowContentWrites: Writes[WorkflowContent] =
    Json.writes[WorkflowContent]

  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
      (__ \ "path").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "standfirst").readNullable[String] ~
      (__ \ "trailtext").readNullable[String] ~
      (__ \ "mainMedia").readNullable[WorkflowContentMainMedia] ~
      (__ \ "trailImageUrl").readNullable[String] ~
      (__ \ "contentType").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map {
        _.map(s => Section(s))
      } ~
      (__ \ "status").readNullable[String].map { sOpt => Status(sOpt.getOrElse("Writers")) } ~
      (__ \ "lastModified").read[DateTime] ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").readNullable[Boolean].map(_.getOrElse(false)) ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[DateTime] ~
      (__ \ "storyBundleId").readNullable[String] ~
      (__ \ "activeInInCopy").readNullable[Boolean].map(_.getOrElse(false)) ~
      (__ \ "takenDown").readNullable[Boolean].map(_.getOrElse(false)) ~
      (__ \ "timeTakenDown").readNullable[DateTime] ~
      (__ \ "wordCount").readNullable[Int].map {
        c => c.getOrElse(0)
      } ~
      (__ \ "launchScheduleDetails").readNullable[LaunchScheduleDetails]
     )(WorkflowContent.apply _)
}

case class ContentItem(stub: Stub, wcOpt: Option[WorkflowContent])
case object ContentItem {
  implicit val contentItemReads = new Reads[ContentItem] {
    def reads(json: JsValue) = {
      for {
        stub <- json.validate[Stub]
        wcOpt <- json.validate[Option[WorkflowContent]]
      } yield ContentItem(stub, wcOpt)
    }
  }
  implicit val contentItemWrites = new Writes[ContentItem] {
    /*
      Dashboard row translates an id to stubId, and title to workingTitle
      Not sure if this is strictly necessary, so haven't included here yet
     */
    def writes(c: ContentItem) = c match {
      case ContentItem(s, Some(wc)) => {
        /*
          Note contentType exists in both objects, the behavior of ++ will take wc as source of truth
        */
        Json.toJson(s).as[JsObject] ++ Json.toJson(wc).as[JsObject] ++ Json.obj("visibleOnUi" -> JsBoolean(WorkflowContent.visibleOnUi(wc)))
      }
      case ContentItem(s, None) => Json.toJson(s)
    }
  }
}

