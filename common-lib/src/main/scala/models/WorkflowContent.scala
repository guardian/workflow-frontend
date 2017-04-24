package models

import models.Status._
import org.joda.time.DateTime
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
  optimisedForWebChanged: Boolean = false,
  sensitive: Option[Boolean] = None,
  legallySensitive: Option[Boolean] = None
)

object WorkflowContentStatusFlags {
  implicit val workflowContentStatusFlagsWrites: Writes[WorkflowContentStatusFlags] =
    Json.writes[WorkflowContentStatusFlags]

  implicit val workflowContentStatusFlags: Reads[WorkflowContentStatusFlags] =
    Json.reads[WorkflowContentStatusFlags]

  val workflowContentStatusFlagsSqsNotificationReads: Reads[WorkflowContentStatusFlags] =
    ((__ \  "settings" \ "commentable").readNullable[String].map(s => s.contains("true")) ~
      (__ \ "toolSettings" \ "seoOptimised").readNullable[String].map(s => s.contains("true")) ~
      (__ \ "toolSettings" \ "seoChanged").readNullable[String].map(s => s.contains("true")) ~
      (__ \  "settings" \ "sensitive").readNullable[String].map(_.map(_ == "true")) ~
      (__ \  "settings" \ "legallySensitive").readNullable[String].map(_.map(_ == "true"))
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

case class ContentItemIds(stubId: Long, composerId: Option[String])
object ContentItemIds {
  implicit val jsonFormat = Json.format[ContentItemIds]
}
