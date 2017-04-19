import com.typesafe.sbt.web.PathMapping
import com.typesafe.sbt.web.pipeline.Pipeline
import sbt._
import sbt.Keys._
import sbtbuildinfo.Plugin._
import com.typesafe.sbt.web.Import._
import com.typesafe.sbt.digest.Import._
import com.typesafe.sbt.gzip.Import._
import com.typesafe.sbt.web.Import.WebKeys._


/**
 * Front-end specific settings for Workflow Projects in SBT.
 *
 * TODO: jspm task
 */
object FrontEnd {

  object PrototypeProject {

    val gzipSettings = Seq(includeFilter in gzip := "*.html" || "*.css" || "*.js")

    val assetPipelineSettings = Seq(pipelineStages := Seq(JSPM.bundle, digest, gzip))

    val settings = SassTask.sassSettings ++ JSPM.settings ++ gzipSettings ++ assetPipelineSettings

  }

}


/**
 * Sass task which runs as a resourceGenerator for a project.
 *
 * Usage: Import Settings from SassTask.settings
 *
 * Uses node-sass (sass-lib) for sass compilation. Compiles to resourceManaged
 * directory with source maps.
 */
object SassTask {
  val sass = taskKey[Seq[File]]("Compiles Sass files")
  val sassOutputStyle = settingKey[String]("CSS output style (nested|expanded|compact|compressed)")

  val baseSassSettings = Seq(
    sassOutputStyle := "compressed",
    resourceManaged in sass := resourceManaged.value / "sass",
    managedResourceDirectories += (resourceManaged in sass).value,
    includeFilter in sass := "*.scss",
    excludeFilter in sass := "_*.scss",

    sass := {
      val log = streams.value.log

      val sourceDir = resourceDirectory.value
      val allSourceFiles = sourceDir ** (includeFilter in sass).value

      val destDir = (resourceManaged in sass).value

      // Copy all scss sources to resourceManaged ( prototype/target/web/resource-managed/main/sass )
      // Necessary to ensure generated source-map URLs are relative to their sources
      IO.copy(allSourceFiles pair rebase(sourceDir, destDir))

      val sourceFiles = (destDir ** (includeFilter in sass).value --- destDir ** (excludeFilter in sass).value).get

      log.info("Compiling " + sourceFiles.length + " Sass sources...")

      // node-sass cli for nodejs lib-sass wrapper
      val sassCmd = baseDirectory(_ / "node_modules/.bin/node-sass").value

      sourceFiles flatMap { src =>
        val dest = src.getParentFile / (src.base + ".min.css")
        log.info("Compiling Sass source: " + src.toString)
        
        Seq(sassCmd.toString, "--include-path", destDir.toString, "--source-map", "true", "--output-style", sassOutputStyle.value, src.toString, dest.toString).!!(log)

        // return sequence of files generated
        Seq(dest, file(dest + ".map"))
      }
    },
    resourceGenerators <+= sass
  )

  val sassSettings = inConfig(Assets)(baseSassSettings)

}

/**
 * JSPM Tasks
 * - bundle: creates a js bundle of all modules
 */
object JSPM {
  val bundle = taskKey[Pipeline.Stage]("JSPM bundle")

  val settings = Seq {
    bundle := { mappings: Seq[PathMapping] =>
      val log = streams.value.log
      log.info("Running JSPM bundle")

      val sourceDir = (resourceDirectory in Assets).value
      val targetDir = webTarget.value / "jspm-bundle"
      val publicTargetDir = targetDir / "public"
      val targetBundleFile = "app.bundle.js"

      IO.copyFile(baseDirectory.value / "package.json", targetDir / "package.json")
      IO.copy(mappings.map { case (file, path) => file -> publicTargetDir / path }, overwrite = true)

      val cmd = Process(baseDirectory.value + s"/node_modules/.bin/jspm bundle app ./public/$targetBundleFile --minify --no-mangle --inject", targetDir) !< log
      if (cmd != 0) sys.error(s"Non-zero error code for `jspm bundle`: $cmd")

      val generated = (publicTargetDir * "app.bundle.*") +++ (publicTargetDir / "config.js")
      val out = generated pair relativeTo(publicTargetDir)
      mappings.filter(_._2 != "config.js") ++ out
    }
  }
}
