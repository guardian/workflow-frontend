import play.sbt.PlayImport.PlayKeys._
import Dependencies._
import sbtbuildinfo.BuildInfo
import scala.sys.env

Test / parallelExecution := false

val scalaVersionNumber = "2.13.12"

val buildInfo = Seq(
  buildInfoPackage := "build",
  buildInfoKeys +=
      "gitCommitId" -> env.getOrElse("GITHUB_SHA", "Unknown"),
)



val commonSettings = Seq(
  scalaVersion := scalaVersionNumber,
  ThisBuild / scalaVersion := scalaVersionNumber,
  organization := "com.gu",
  version      := "0.1",
  Test / fork := false,
  resolvers ++= Seq(
    "Typesafe Repository" at "https://repo.typesafe.com/typesafe/releases/"
  ),
  scalacOptions ++= Seq(
    "-feature",
    "-deprecation",
    "-language:higherKinds",
    "-Xfatal-warnings",
    "-Wunused",
    "-Wvalue-discard",
    "-Wnonunit-statement",
    "-Wconf:site=views\\.html.*&cat=unused:silent,site=controllers.ReverseAssets.versioned&cat=other-pure-statement:silent,any:warning-verbose",
    "-unchecked"
  )
)

def project(path: String): Project = Project(path, file(path)).settings(commonSettings)

def playProject(path: String): Project =
  Project(path, file("."))
    .enablePlugins(PlayScala, JDebPackaging, SystemdPlugin, BuildInfoPlugin)
    .settings(
      libraryDependencies += "org.playframework" %% "play-ahc-ws" % "3.0.1",
      pipelineStages := Seq(digest, gzip)
    )
    .settings(commonSettings ++ buildInfo)
    .dependsOn(commonLib)
    .dependsOn(commonLib % "test->test")

lazy val commonLib = project("common-lib")
  .settings(
    libraryDependencies
      ++= Seq(
        "org.playframework" %% "play" % "3.0.1", "org.playframework" %% "play-ahc-ws" % "3.0.1",
        "com.fasterxml.jackson.core" % "jackson-core" % "2.15.0"
      )
      ++ logbackDependencies
      ++ testDependencies
      ++ awsDependencies
      ++ jsonDependencies
      ++ cacheDependencies
      ++ cryptoDependencies
  )

val application = "workflow-frontend"

lazy val root = playProject(application)
  .enablePlugins(JDebPackaging, BuildInfoPlugin)
  .settings(
    libraryDependencies
      ++= awsDependencies
      ++ authDependencies
      ++ testDependencies
      ++ jsonDependencies
      ++ permissionsDependencies
  )
  .settings(libraryDependencies += filters)
  .settings(playDefaultPort := 9090)
  .settings(
    Universal / packageName := application,
    Universal / concurrentRestrictions := List(Tags.limit(Tags.All, 1)),
    Universal / javaOptions ++= Seq(
      // Since play uses separate pidfile we have to provide it with a proper path
      // name of the pid file must be play.pid
      s"-Dpidfile.path=/var/run/${packageName.value}/play.pid"
    ),
    Universal / javaOptions ++= Seq(
      "-Dpidfile.path=/dev/null"
    ),
    debianPackageDependencies := Seq("java11-runtime-headless"),
    maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>",
    packageSummary := "workflow-frontend",
    packageDescription := """Workflow, part of the suite of Guardian CMS tools"""
  )
  .settings(
    Universal / topLevelDirectory := Some(normalizedName.value),
    Universal / name := normalizedName.value
  )


