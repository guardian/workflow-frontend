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
  scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings")
)

def project(path: String): Project = Project(path, file(path)).settings(commonSettings)

def playProject(path: String): Project =
  Project(path, file("."))
    .enablePlugins(PlayScala, JDebPackaging, SystemdPlugin, BuildInfoPlugin)
    .settings(
      libraryDependencies += "com.typesafe.play" %% "play-ahc-ws" % "2.8.21",
      //Necessary to override jackson-databind versions due to AWS and Play incompatibility
      dependencyOverrides ++= jacksonDependencyOverrides,
      pipelineStages := Seq(digest, gzip)
    )
    .settings(commonSettings ++ buildInfo)
    .dependsOn(commonLib)
    .dependsOn(commonLib % "test->test")

lazy val commonLib = project("common-lib")
  .settings(
    libraryDependencies
      ++= Seq("com.typesafe.play" %% "play" % "2.8.21", "com.typesafe.play" %% "play-ahc-ws" % "2.8.21")
      ++ logbackDependencies
      ++ testDependencies
      ++ awsDependencies
      ++ jsonDependencies
      ++ webPushDependencies
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
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    Universal / javaOptions ++= Seq(
      "-Dpidfile.path=/dev/null"
    ),
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>",
    packageSummary := "workflow-frontend",
    packageDescription := """Workflow, part of the suite of Guardian CMS tools"""
  )
  .settings(
    Universal / topLevelDirectory := Some(normalizedName.value),
    Universal / name := normalizedName.value
  )

lazy val notificationLambda = project("notification")
  .enablePlugins(JavaAppPackaging)
  .settings(
    name := "workflow-notification",
    Universal / topLevelDirectory := None,
    Universal / packageName := normalizedName.value,
    libraryDependencies ++= notificationDependencies
  )
  .dependsOn(commonLib % "compile->compile;test->test")

