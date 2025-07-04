package config

import java.util.UUID

import com.gu.workflow.util._
import play.Logger
import play.api.{Configuration, Logging}

import scala.jdk.CollectionConverters._
import scala.util.Try

class Config(playConfig: Configuration) extends AwsInstanceTags with Logging {
  lazy val stage: Stage = readTag("Stage") match {
    case Some(value) => Stage(value)
    // If in AWS and we don't know our stage, fail fast to avoid ending up running an instance with dev config in PROD!
    case other if instanceId.nonEmpty => throw new IllegalStateException(s"Unable to read Stage tag: $other")
    case None => Stage("DEV") // default to dev stage
  }
  logger.info(s"running in stage: $stage")

  lazy val isDev: Boolean = stage == Dev

  lazy val isProd: Boolean = stage == Prod

  lazy val domain: String = stage.appDomain

  lazy val localLogShipping: Boolean = sys.env.getOrElse("LOCAL_LOG_SHIPPING", "false").toBoolean

  logger.info(s"Domain is: $domain")

  lazy val host: String = s"https://workflow.$domain"
  logger.info(s"Host is: $host")

  lazy val composerUrl: String = s"https://composer.$domain"
  lazy val composerRestorerUrl: String = s"https://restorer.$domain/content"

  lazy val mediaAtomMakerUrl: String = s"https://video.$domain"
  lazy val atomWorkshopUrl: String = s"https://atomworkshop.$domain"
  lazy val telemetryUrl: String = s"https://user-telemetry.$domain"

  private lazy val composerUrls: Set[String] = stage match {
    case Dev => Set(composerUrl) // Composer secondary does not exist in DEV
    case _ => Set(composerUrl, s"https://composer-secondary.$domain")
  }

  private def allowDevServiceToCallWorkflowCode(subDomain: String) = stage match {
    case Code => Some(s"https://${subDomain}.${Dev.appDomain}")
    case _ => None
  }

  def baseUri(host: String) = s"https://$host"

  final def getStringSetFromConf(key: String): Set[String] = Try(
    playConfig
      .get[String](key)
      .split(",")
      .map(_.trim)
      .toSet
  ).getOrElse(Set.empty)

  lazy val corsAllowedOrigins: Set[String] = getStringSetFromConf("security.cors.allowedOrigins").map(baseUri)

  lazy val corsAllowedDomains: Set[String] = composerUrls +
    mediaAtomMakerUrl ++ allowDevServiceToCallWorkflowCode("video") +
    atomWorkshopUrl ++ allowDevServiceToCallWorkflowCode("atomworkshop") +
    s"https://recipes.$domain" ++ allowDevServiceToCallWorkflowCode("recipes") +
    telemetryUrl

  lazy val presenceUrl: String = s"wss://presence.$domain/socket"
  lazy val presenceClientLib: String = s"https://presence.$domain/client/1/lib.js"

  lazy val preferencesHost: String = s"preferences.$domain"
  lazy val preferencesUrl: String = s"https://$preferencesHost/preferences"

  lazy val pinboardLoaderUrl: String = s"https://pinboard.$domain/pinboard.loader.js"

  lazy val tagManagerUrl: String = s"https://tagmanager.$domain"

  lazy val capiPreviewIamUrl: String = playConfig.get[String]("capi.preview.iamUrl")
  lazy val capiPreviewRole: String = playConfig.get[String]("capi.preview.role")

  lazy val sharedSecret: String = playConfig.get[String]("api.sharedsecret")

  lazy val incopyOpenUrl: String = "gnm://openinincopy/storybundle/${storyBundleId}/checkout/readwrite"
  lazy val incopyExportUrl: String = "gnm://composer/export/${composerId}"
  lazy val indesignExportUrl: String = "gnm://composerindesign/export/${composerId}"

  lazy val viewerUrl: String = s"https://viewer.$domain"

  lazy val storyPackagesUrl: String = s"https://packages.$domain"

  lazy val no2faUser: String = "composer.test@guardian.co.uk"

  lazy val editorialSupportDynamoTable: String = stage match {
    case Prod => "editorial-support-PROD"
    case _ => "editorial-support-CODE"
  }

  lazy val atomTypes: List[String] = List("media", "chart")
  lazy val contentTypes: List[String] = List("article", "liveblog", "gallery", "interactive", "picture", "video", "audio")

  lazy val sessionId: String = UUID.randomUUID().toString

  lazy val capiKey: String = playConfig.get[String]("capi.key")

  lazy val pandaSystem: String = "workflow"
  lazy val pandaBucketName: String = "pan-domain-auth-settings"

  lazy val loggingStreamName: Option[String] = playConfig.getOptional[String]("aws.kinesis.logging.streamName")
  lazy val loggingRole: Option[String] = playConfig.getOptional[String]("aws.kinesis.logging.stsRoleToAssume")

  lazy val apiRoot: String = playConfig.get[String]("api.url")
}
