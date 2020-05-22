package config

import java.net.URI

import com.gu.workflow.util._
import org.apache.http.client.utils.URIBuilder

case class EditorialToolsConfig(stage: Stage) {
  private def buildURI(subDomain: String, scheme: String = "https", path: Option[String] = None): URI = {
    val builder = new URIBuilder()
      .setScheme(scheme)
      .setHost(s"$subDomain.${stage.appDomain}")

    path.map(builder.setPath)
    builder.build()
  }

  val composerUrl: URI = buildURI(subDomain = "composer")

  val restorerUrl: URI = buildURI(subDomain = "restorer")

  val mediaAtomMakerUrl: URI = buildURI(subDomain = "video")

  val atomWorkshopUrl: URI = buildURI(subDomain = "atomworkshop")

  val presenceUrl: URI = buildURI(subDomain = "presence", scheme = "wss", path = Some("/socket"))

  val presenceClientLib: URI = buildURI(subDomain = "presence", path = Some("/client/1/lib.js"))

  val preferencesUrl: URI = buildURI(subDomain = "preferences", path = Some("/preferences"))

  val tagManagerUrl: URI = buildURI(subDomain = "tagmanager")

  val viewerUrl: URI = buildURI(subDomain = "viewer")

  val storyPackagesUrl: URI = buildURI(subDomain = "packages")
}

case class CORSConfig(stage: Stage) {
  val defaultCorsAble: Set[URI] = {
    val base = Set(EditorialToolsConfig(stage).composerUrl)

    stage match {
      case Dev => {
        // allow DEV to access CODE
        base ++ Set(EditorialToolsConfig(Code).composerUrl)
      }
      case _ => base
    }
  }

  val atomCorsAble: Set[URI] = {
    val editorialTools = EditorialToolsConfig(stage)
    val base = defaultCorsAble ++ Set(
      editorialTools.mediaAtomMakerUrl, editorialTools.atomWorkshopUrl
    )

    stage match {
      case Dev => {
        // allow DEV to access CODE
        val codeEditorialTools = EditorialToolsConfig(Code)
        val code = Set(
          codeEditorialTools.mediaAtomMakerUrl, codeEditorialTools.atomWorkshopUrl
        )

        base ++ code
      }
      case _ => base
    }
  }
}
