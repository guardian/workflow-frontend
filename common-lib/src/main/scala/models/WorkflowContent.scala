package models

import com.gu.workflow.lib.Util
import models.Status._
import org.joda.time.DateTime
import play.api.Logger
import play.api.libs.json._
import play.api.libs.functional.syntax._


case class Asset(assetType: String, mimeType:String, url:String, fields: Map[String, String])
object Asset {
  def getImageAssetSize(asset: Asset): Option[Long] = {
       for {
        width <- asset.fields.get("width")
        height <- asset.fields.get("height")
      } yield (width.toLong) * (height.toLong)
  }

  def getImageAssetUrl(assets: List[Asset]): Option[String] = {
    val imageAssets = assets.filter( asset => {
      asset.assetType == "image" &&
      !asset.fields.get("isMaster").contains("true")
    })
    val smallestAsset = imageAssets.reduceLeft((l,r) =>
        if(getImageAssetSize(l).get < getImageAssetSize(r).get){ l } else { r })

    Some(smallestAsset.url)
  }
}

case class Tag(id: Long, section: Section, `type`: String, externalName: String, path: Option[String] = None)
object Tag { implicit val jsonFormats = Json.format[Tag]}
case class TagUsage(tag: Tag, isLead: Boolean)
object TagUsage { implicit val jsonFormats = Json.format[TagUsage]}
case class Element(elementType: String, fields: Map[String, String], assets: List[Asset])
case class Block(id: String, lastModified: DateTime, elements: List[Element])
case class Thumbnail(fields: Map[String, String], assets: List[Asset])
case class User(email: String, firstName: String, lastName: String)
object User { implicit val jsonFormats = Json.format[User]}

case class WorkflowContentStatusFlags(
  commentable: Boolean     = false,
  optimisedForWeb: Boolean = false,
  optimisedForWebChanged: Boolean = false

)

object WorkflowContentStatusFlags {
  implicit val workflowContentStatusFlagsWrites: Writes[WorkflowContentStatusFlags] =
    Json.writes[WorkflowContentStatusFlags]

  implicit val workflowContentStatusFlags: Reads[WorkflowContentStatusFlags] =
    Json.reads[WorkflowContentStatusFlags]

  val workflowContentStatusFlagsSqsNotificationReads: Reads[WorkflowContentStatusFlags] =
    ((__ \  "settings" \ "commentable").readNullable[String].map(s => s.exists(_=="true")) ~
      (__ \ "toolSettings" \ "seoOptimised").readNullable[String].map(s => s.exists(_=="true")) ~
      (__ \ "toolSettings" \ "seoChanged").readNullable[String].map(s => s.exists(_=="true"))
    )(WorkflowContentStatusFlags.apply _)
}

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

  def getMainMedia(blockOption: Option[Block]): WorkflowContentMainMedia = {
    blockOption.map(block => WorkflowContentMainMedia(
        getMainMediaType(block),
        getMainMediaUrl(block),
        getMainMediaField("caption", block),
        getMainMediaField("alt", block)
      )).getOrElse(WorkflowContentMainMedia())
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
      (__ \ "embargoedUntil").readNullable[DateTime] ~
      (__ \ "embargoedIndefinitely").readNullable[Boolean].map(s => s.getOrElse(false))
      )(LaunchScheduleDetails.apply _)

   val launchScheduleDetailsSQSReads: Reads[LaunchScheduleDetails] =
    ((__ \ "scheduledLaunchDate").readNullable[DateTime] ~
      (__ \ "settings" \ "embargoedUntil").readNullable[String].map(s => s.map(t => new DateTime(t)))  ~
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
  status: Status,
  lastModified: DateTime,
  lastModifiedBy: Option[String],
  published: Boolean,
  timePublished: Option[DateTime],
  storyBundleId: Option[String],
  activeInInCopy: Boolean,
  takenDown: Boolean,
  timeTakenDown: Option[DateTime],
  wordCount: Int,
  launchScheduleDetails: LaunchScheduleDetails,
  statusFlags: WorkflowContentStatusFlags
)

object WorkflowContent {
  implicit val dateTimeFormat = DateFormat

  def getTrailImageUrl(thumbnail: Option[Thumbnail]): Option[String] = {
    for {
      t <- thumbnail
      urlOption <- Asset.getImageAssetUrl(t.assets)
    } yield urlOption
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
      (__ \ "status").readNullable[String].map { sOpt => Status(sOpt.getOrElse("Writers")) } ~
      (__ \ "lastModified").read[DateTime] ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[DateTime] ~
      (__ \ "storyBundleId").readNullable[String] ~
      (__ \ "activeInInCopy").readNullable[Boolean].map(_.getOrElse(false)) ~
      (__ \ "takenDown").readNullable[Boolean].map(_.getOrElse(false)) ~
      (__ \ "timeTakenDown").readNullable[DateTime] ~
      (__ \ "wordCount").readNullable[Int].map {
        c => c.getOrElse(0)
      } ~
      (__ \ "launchScheduleDetails").readNullable[LaunchScheduleDetails].map(_.getOrElse(LaunchScheduleDetails(None, None, false))) ~
      (__ \ "statusFlags").read[WorkflowContentStatusFlags]
     )(WorkflowContent.apply _)
}



case class ContentItem(stub: Stub, wcOpt: Option[WorkflowContent])
case object ContentItem {

  implicit val contentItemReads = new Reads[ContentItem] {
    def reads(json: JsValue) = {
      for {
        stub <- json.validate[Stub]
        wcOpt <- json.validateOpt[WorkflowContent]
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
        Json.toJson(s).as[JsObject] ++ Json.toJson(wc).as[JsObject]
      }
      case ContentItem(s, None) => Json.toJson(s)
    }
  }

  val title: ContentItem => String = c => c.stub.title
  val noteField: ContentItem => Option[String] = c => c.stub.note
  val headline: ContentItem => Option[String] = c => c.wcOpt.flatMap(_.headline)
  val status: ContentItem => Option[Status] = c => c.wcOpt.map(_.status)
  val contentTypeWC: ContentItem => Option[String] = c => c.wcOpt.map(_.contentType)
  val contentTypeS: ContentItem => String = c => c.stub.contentType
  val inInCopy: ContentItem => Option[Boolean] = c => c.wcOpt.map(_.activeInInCopy)
  val section: ContentItem => String = c => c.stub.section
  val published: ContentItem => Option[Boolean] = c => c.wcOpt.map(_.published)
  val due: ContentItem => Option[DateTime] = c => c.stub.due
  val stubLastMod: ContentItem => DateTime = c => c.stub.lastModified
  val createdAt: ContentItem => DateTime = c => c.stub.createdAt
  val wcLastMod: ContentItem => Option[DateTime] = c => c.wcOpt.map(_.lastModified)
  val timePublished: ContentItem => Option[DateTime] = c => c.wcOpt.flatMap(_.timePublished)
  val takenDown: ContentItem => Option[Boolean] = c => c.wcOpt.map(_.takenDown)
  val timeTakenDown: ContentItem => Option[DateTime] = c => c.wcOpt.flatMap(_.timeTakenDown)
  val embargoedUntil: ContentItem => Option[DateTime] = c => c.wcOpt.flatMap(_.launchScheduleDetails.embargoedUntil)
  val embargoedIndefinitely: ContentItem => Option[Boolean] = c => c.wcOpt.map(_.launchScheduleDetails.embargoedIndefinitely)
  val scheduledLaunchDate: ContentItem => Option[DateTime] = c => c.wcOpt.flatMap(_.launchScheduleDetails.scheduledLaunchDate)
  val storyBundleId: ContentItem => Option[String] = c => c.wcOpt.flatMap(_.storyBundleId)

}

case class ContentItemIds(stubId: Long, composerId: Option[String])
object ContentItemIds {
  implicit val jsonFormat = Json.format[ContentItemIds]
}
