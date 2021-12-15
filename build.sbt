import play.sbt.PlayImport.PlayKeys._
import Dependencies._
import com.gu.riffraff.artifact.BuildInfo

Test / parallelExecution := false

val scalaVersionNumber = "2.12.11"

val buildInfo = Seq(
  buildInfoPackage := "build",
  buildInfoKeys ++= {
    val buildInfo = BuildInfo(baseDirectory.value)

    Seq[BuildInfoKey](
      "gitCommitId" -> buildInfo.revision,
      "buildNumber" -> buildInfo.buildIdentifier
    )
  }
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
    .settings(libraryDependencies += ws)
    .settings(commonSettings ++ buildInfo)
    .dependsOn(commonLib)
    .dependsOn(commonLib % "test->test")

lazy val commonLib = project("common-lib")
  .settings(
    libraryDependencies
      ++= Seq("com.typesafe.play" %% "play" % "2.7.4", ws)
      ++ logbackDependencies
      ++ testDependencies
      ++ awsDependencies
      ++ akkaDependencies
      ++ jsonDependencies
      ++ webPushDependencies
      ++ cacheDependencies
      ++ cryptoDependencies
  )

val application = "workflow-frontend"

lazy val root = playProject(application)
  .enablePlugins(RiffRaffArtifact, JDebPackaging)
  .settings(
    libraryDependencies
      ++= awsDependencies
      ++ authDependencies
      ++ akkaDependencies
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
    riffRaffPackageType := (Debian / packageBin).value,
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffArtifactPublishPath := application,
    riffRaffPackageName := s"editorial-tools:workflow:$application",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffArtifactResources := Seq(
      riffRaffPackageType.value -> s"$application/${riffRaffPackageType.value.getName}",
      (notificationLambda / Universal / packageBin).value -> s"${(notificationLambda / name).value}/${(notificationLambda / Universal / packageBin).value.getName}",
      baseDirectory.value / "conf" / "riff-raff.yaml" -> "riff-raff.yaml",
      baseDirectory.value / "fluentbit/td-agent-bit.conf" -> "workflow-frontend-fluentbit/td-agent-bit.conf",
      baseDirectory.value / "fluentbit/parsers.conf" -> "workflow-frontend-fluentbit/parsers.conf"
    ),
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

