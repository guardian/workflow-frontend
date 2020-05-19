package config

import java.util.UUID

import com.gu.workflow.util._
import play.Logger
import play.api.Configuration

import scala.collection.JavaConverters._
import scala.util.Try

class Config(playConfig: Configuration) extends AwsInstanceTags {
  lazy val stage: Stage = readTag("Stage") match {
    case Some(value) => Stage(value)
    // If in AWS and we don't know our stage, fail fast to avoid ending up running an instance with dev config in PROD!
    case other if instanceId.nonEmpty => throw new IllegalStateException(s"Unable to read Stage tag: $other")
    case None => Stage("DEV") // default to dev stage
  }
  Logger.info(s"running in stage: $stage")

  lazy val isDev: Boolean = stage == Dev

  lazy val domain: String = stage.appDomain

  lazy val localLogShipping: Boolean = sys.env.getOrElse("LOCAL_LOG_SHIPPING", "false").toBoolean

  Logger.info(s"Domain is: $domain")

  lazy val host: String = s"https://workflow.$domain"
  Logger.info(s"Host is: $host")

  lazy val composerUrl: String = s"https://composer.$domain"
  lazy val composerRestorerUrl: String = s"https://restorer.$domain/content"

  lazy val mediaAtomMakerUrl: String = s"https://video.$domain"
  lazy val atomWorkshopUrl: String = s"https://atomworkshop.$domain"

  lazy val mediaAtomMakerUrls: Set[String] = stage match {
    case Code => Set(mediaAtomMakerUrl, s"https://video.${Dev.appDomain}") // allow MAM in DEV to call Workflow CODE
    case _ => Set(mediaAtomMakerUrl)
  }

  lazy val atomWorkshopUrls: Set[String] = stage match {
    case Code => Set(s"https://atomworkshop.${Dev.appDomain}", atomWorkshopUrl) // allow MAM in DEV to call Workflow CODE
    case _ => Set(atomWorkshopUrl)
  }

  lazy val presenceUrl: String = s"wss://presence.$domain/socket"
  lazy val presenceClientLib: String = s"https://presence.$domain/client/1/lib.js"

  lazy val preferencesUrl: String = s"https://preferences.${stage.appDomain}/preferences"

  lazy val tagManagerUrl: String = s"https://tagmanager.${stage.appDomain}"

  lazy val capiPreviewIamUrl: String = playConfig.get[String]("capi.preview.iamUrl")
  lazy val capiPreviewRole: String = playConfig.get[String]("capi.preview.role")

  lazy val webPushPublicKey: String = playConfig.get[String]("webpush.publicKey")
  lazy val webPushPrivateKey: String = playConfig.get[String]("webpush.privateKey")

  lazy val sharedSecret: String = playConfig.get[String]("api.sharedsecret")

  lazy val incopyOpenUrl: String = "gnm://openinincopy/storybundle/${storyBundleId}/checkout/readwrite"
  lazy val incopyExportUrl: String = "gnm://composer/export/${composerId}"
  lazy val indesignExportUrl: String = "gnm://composerindesign/export/${composerId}"

  lazy val viewerUrl: String = s"https://viewer.$domain"

  lazy val storyPackagesUrl: String = s"https://packages.$domain"

  lazy val googleTrackingId: String = playConfig.get[String]("google.tracking.id")

  lazy val no2faUser: String = "composer.test@guardian.co.uk"

  lazy val editorialSupportDynamoTable: String = stage match {
    case Prod => "editorial-support-PROD"
    case _ => "editorial-support-CODE"
  }

  lazy val atomTypes: List[String] = List("media", "chart")
  lazy val contentTypes: List[String] = List("article", "liveblog", "gallery", "interactive", "picture", "video", "audio")

  lazy val sessionId: String = UUID.randomUUID().toString

  implicit val defaultExecutionContext = scala.concurrent.ExecutionContext.Implicits.global

  lazy val adminWhitelist: List[String] = Try {
    playConfig.underlying.getStringList("application.admin.whitelist").asScala.toList
  }.toOption.getOrElse(List.empty)

  lazy val capiKey: String = playConfig.get[String]("capi.key")
}
