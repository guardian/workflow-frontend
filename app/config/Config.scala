package config

import com.gu.workflow.lib.{Config => config}
import com.gu.workflow.util.AwsInstanceTags
import lib.LogStashConf
import play.Logger
import java.util.UUID

object Config extends AwsInstanceTags {
  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }
  Logger.info(s"running in stage: $stage")

  def appDomain(appStage: String): String = {
    appStage match {
      case "PROD" => "gutools.co.uk"
      case "DEV" => "local.dev-gutools.co.uk"
      case x => s"${x.toLowerCase()}.dev-gutools.co.uk"
    }
  }

  lazy val domain: String = appDomain(stage)

  Logger.info(s"Domain is: $domain")

  lazy val host: String = s"https://workflow.$domain"
  Logger.info(s"Host is: $host")

  lazy val composerUrl: String = s"https://composer.$domain"
  lazy val composerRestorerUrl: String = s"https://restorer.$domain/content"

  lazy val mediaAtomMakerUrl: String = s"https://video.$domain"
  lazy val atomWorkshopUrl: String = s"https://atomworkshop.$domain"

  lazy val mediaAtomMakerUrls: Set[String] = stage match {
    case "CODE" => Set(mediaAtomMakerUrl, s"https://video.${appDomain("DEV")}") // allow MAM in DEV to call Workflow CODE
    case _ => Set(mediaAtomMakerUrl)
  }

  lazy val atomWorkshopUrls: Set[String] = stage match {
    case "CODE" => Set(s"https://atomworkshop.${appDomain("DEV")}", atomWorkshopUrl) // allow MAM in DEV to call Workflow CODE
    case _ => Set(atomWorkshopUrl)
  }

  lazy val presenceUrl: String = s"wss://presence.$domain/socket"
  lazy val presenceClientLib: String = s"https://presence.$domain/client/1/lib.js"

  lazy val preferencesUrl: String = s"https://preferences.$domain/preferences"
  lazy val tagManagerUrl: String = stage match {
    case "PROD" => s"https://tagmanager.$domain"
    case _ => "https://tagmanager.code.dev-gutools.co.uk"
  }

  lazy val capiPreviewIamUrl: String = config.getConfigStringOrFail("capi.preview.iamUrl")
  lazy val capiPreviewRole: String = config.getConfigStringOrFail("capi.preview.role")

  lazy val incopyExportUrl: String = "gnm://composer/export/${composerId}"
  lazy val indesignExportUrl: String = "gnm://composerindesign/export/${composerId}"

  lazy val viewerUrl: String = s"https://viewer.$domain"

  lazy val googleTrackingId: String = config.getConfigWithDefault("google.tracking.id", "").right.toString()

  lazy val appSecret: String = config.getConfigStringOrFail("application.secret")

  lazy val no2faUser: String = "composer.test@guardian.co.uk"

  lazy val editorialSupportDynamoTable: String = s"support-staff-$stage"

  lazy val atomTypes: List[String] = List("media", "storyquestions")
  lazy val contentTypes: List[String] = List("article", "liveblog", "gallery", "interactive", "picture", "video", "audio")

  lazy val sessionId: String = UUID.randomUUID().toString

  // logstash conf
  private lazy val logStashHost: String = "ingest.logs.gutools.co.uk"
  private lazy val logStashPort: Int = 6379
  private lazy val logStashEnabled: Boolean = config.getConfigBooleanOrElse("logging.logstash.enabled", true)
  lazy val logStashConf = LogStashConf(logStashHost, logStashPort, logStashEnabled)

  implicit val defaultExecutionContext =
    scala.concurrent.ExecutionContext.Implicits.global

  lazy val testMode: Boolean = config.getConfigBooleanOrElse("testMode", false)

}
