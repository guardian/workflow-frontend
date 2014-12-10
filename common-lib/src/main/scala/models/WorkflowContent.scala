package models

import models.Status._
import com.gu.workflow.db.Schema
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.functional.syntax._

case class WorkflowContent(
  composerId: String,
  path: Option[String],
  headline: Option[String],
  standfirst: Option[String],
  trailtext: Option[String],
  mainMedia: Option[String],
  mainMediaUrl: Option[String],
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
  timeTakenDown: Option[DateTime]
)

object WorkflowContent {
  implicit val dateTimeFormat = DateFormat

  def getMainMedia(blockOption: Option[Block]) = {
    for {
      block   <- blockOption
      element <- block.elements.headOption
    } yield element.elementType
  }


  def getImageAssetSize(asset: Asset): Option[Long] = {
       for {
        width <- asset.fields.get("width")
        height <- asset.fields.get("height")
      } yield (width.toLong) * (height.toLong)
  }

  def getImageAssetUrl(assets: List[Asset]): Option[String] = {
    val imageAssets = assets.filter(_.assetType == "image")
    val smallestAsset = imageAssets.reduceLeft((l,r) => if(getImageAssetSize(l).get < getImageAssetSize(r).get){ l } else { r })

    Some(smallestAsset.url)
  }

  def getMainMediaUrl(blocks: Option[Block]): Option[String] = {
    getMainMedia(blocks) match {
      case Some("image") => for {
        block <- blocks
        element <- block.elements.headOption
        mainMediaUrlOption = getImageAssetUrl(element.assets)
        mainMediaUrl <- mainMediaUrlOption
      } yield mainMediaUrl
      case _ => None
    }
  }

  def getTrailImageUrl(thumbnail: Option[Thumbnail]): Option[String] = {
    for {
      t <- thumbnail
      urlOption <- getImageAssetUrl(t.assets)
    } yield urlOption 
  }

  def getSectionFromTags(tags: List[Tag]): Option[Section] = {
    tags.headOption.map { t => t.section }
  }

  def fromContentUpdateEvent(e: ContentUpdateEvent): WorkflowContent = {
    WorkflowContent(
      e.composerId,
      e.identifiers.get("path"),
      e.fields.get("headline"),
      e.fields.get("standfirst"),
      e.fields.get("trailText"),
      getMainMedia(e.mainBlock),
      getMainMediaUrl(e.mainBlock),
      getTrailImageUrl(e.thumbnail),
      e.`type`,
      getSectionFromTags(e.tags),
      e.status, // not written to the database but the DTO requires a value.
      e.lastModified,
      e.user,
      commentable=e.commentable,
      published = e.published,
      timePublished = e.publicationDate,
      storyBundleId = e.storyBundleId,
      false, // assume not active in incopy
      takenDown = false,
      timeTakenDown = None
    )
  }

  def fromContentRow(row: Schema.ContentRow): WorkflowContent = row match {
    case (composerId, path, lastMod, lastModBy, status, contentType, commentable,
          headline, standfirst, trailtext, mainMedia, mainMediaUrl, trailImageUrl, published, timePublished, _, storyBundleId, activeInInCopy,
          takenDown, timeTakenDown) =>
          WorkflowContent(
            composerId, path, headline, standfirst, trailtext, mainMedia, mainMediaUrl, trailImageUrl, contentType, None, Status(status), lastMod,
            lastModBy, commentable, published, timePublished, storyBundleId,
            activeInInCopy, takenDown, timeTakenDown)
  }
  def newContentRow(wc: WorkflowContent, revision: Option[Long]): Schema.ContentRow =
    (wc.composerId, wc.path, wc.lastModified, wc.lastModifiedBy, wc.status.name,
     wc.contentType, wc.commentable, wc.headline, wc.standfirst, wc.trailtext, wc.mainMedia, wc.mainMediaUrl, wc.trailImageUrl, wc.published, wc.timePublished,
     revision, wc.storyBundleId, wc.activeInInCopy, false, None)

  implicit val workFlowContentWrites: Writes[WorkflowContent] = Json.writes[WorkflowContent]

  implicit val workFlowContentReads: Reads[WorkflowContent] =
    ((__ \ "composerId").read[String] ~
      (__ \ "path").readNullable[String] ~
      (__ \ "headline").readNullable[String] ~
      (__ \ "standfirst").readNullable[String] ~
      (__ \ "trailtext").readNullable[String] ~
      (__ \ "mainMedia").readNullable[String] ~
      (__ \ "mainMediaUrl").readNullable[String] ~
      (__ \ "trailImageUrl").readNullable[String] ~
      (__ \ "contentType").read[String] ~
      (__ \ "section" \ "name").readNullable[String].map { _.map(s => Section(s))} ~
      (__ \ "status").read[String].map { s => Status(s) } ~
      (__ \ "lastModified").read[DateTime] ~
      (__ \ "lastModifiedBy").readNullable[String] ~
      (__ \ "commentable").read[Boolean] ~
      (__ \ "published").read[Boolean] ~
      (__ \ "timePublished").readNullable[DateTime] ~
      (__ \ "storyBundleId").readNullable[String] ~
      (__ \ "activeInIncopy").read[Boolean] ~
      (__ \ "takenDown").read[Boolean] ~
      (__ \ "timeTakenDown").readNullable[DateTime]
      )(WorkflowContent.apply _)
}
