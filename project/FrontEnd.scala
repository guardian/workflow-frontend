import sbt._
import sbt.Keys._
import com.typesafe.sbt.web.Import._
import com.typesafe.sbt.gzip.Import._


/**
 * Front-end specific settings for Workflow Projects in SBT.
 *
 * TODO: jspm task
 */
object FrontEnd {

  object PrototypeProject {

    val gzipSettings = Seq(includeFilter in gzip := "*.html" || "*.css" || "*.js")

    val assetPipelineSettings = Seq(pipelineStages := Seq(gzip))

    val settings = SassTask.sassSettings ++ gzipSettings ++ assetPipelineSettings

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

        // sourcemap arg has to go at end
        Seq(sassCmd.toString, "--include-path", destDir.toString, "--output-style", sassOutputStyle.value, src.toString, dest.toString, "--source-map").!!(log)

        // return sequence of files generated
        Seq(dest, file(dest + ".map"))
      }
    },
    resourceGenerators <+= sass
  )

  val sassSettings = inConfig(Assets)(baseSassSettings)

}