package config

import com.gu.workflow.util._
import play.Logger
import java.util.UUID

import com.gu.workflow.lib.CommonConfig

object Config extends CommonConfig with AwsInstanceTags {
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

  lazy val editorialToolsConfig: EditorialToolsConfig = stage match {
    case Dev => EditorialToolsConfig(Code) // DEV uses the CODE version of other Tools
    case _ => EditorialToolsConfig(stage)
  }

  lazy val corsConfig: CORSConfig = CORSConfig(stage)

  lazy val capiPreviewIamUrl: String = getConfigStringOrFail("capi.preview.iamUrl")
  lazy val capiPreviewRole: String = getConfigStringOrFail("capi.preview.role")

  lazy val webPushPublicKey: String = getConfigStringOrFail("webpush.publicKey")
  lazy val webPushPrivateKey: String = getConfigStringOrFail("webpush.privateKey")

  lazy val sharedSecret: String = getConfigStringOrFail("api.sharedsecret")

  lazy val incopyOpenUrl: String = "gnm://openinincopy/storybundle/${storyBundleId}/checkout/readwrite"
  lazy val incopyExportUrl: String = "gnm://composer/export/${composerId}"
  lazy val indesignExportUrl: String = "gnm://composerindesign/export/${composerId}"

  lazy val viewerUrl: String = s"https://viewer.$domain"

  lazy val storyPackagesUrl: String = s"https://packages.$domain"

  lazy val googleTrackingId: String = getConfigStringOrFail("google.tracking.id")

  lazy val no2faUser: String = "composer.test@guardian.co.uk"

  lazy val editorialSupportDynamoTable: String = stage match {
    case Prod => "editorial-support-PROD"
    case _ => "editorial-support-CODE"
  }

  lazy val atomTypes: List[String] = List("media", "chart")
  lazy val contentTypes: List[String] = List("article", "liveblog", "gallery", "interactive", "picture", "video", "audio")

  lazy val sessionId: String = UUID.randomUUID().toString

  implicit val defaultExecutionContext = scala.concurrent.ExecutionContext.Implicits.global

  lazy val adminWhitelist: List[String] = getConfigStringList("application.admin.whitelist").right.getOrElse(List.empty)

  lazy val capiKey: String = getConfigStringOrFail("capi.key")
}
