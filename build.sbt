import play.sbt.PlayImport.PlayKeys._
import Dependencies._
import com.gu.riffraff.artifact.BuildInfo

parallelExecution in Test := false

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
  scalaVersion in ThisBuild := scalaVersionNumber,
  organization := "com.gu",
  version      := "0.1",
  fork in Test := false,
  resolvers ++= Seq(
    "Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/",
    "scalaz-bintray" at "https://dl.bintray.com/scalaz/releases"
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
  )
  .settings(libraryDependencies += filters)
  .settings(playDefaultPort := 9090)
  .settings(
    packageName in Universal := application,
    concurrentRestrictions in Universal := List(Tags.limit(Tags.All, 1)),
    javaOptions in Universal ++= Seq(
      // Since play uses separate pidfile we have to provide it with a proper path
      // name of the pid file must be play.pid
      s"-Dpidfile.path=/var/run/${packageName.value}/play.pid"
    ),
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    riffRaffPackageType := (packageBin in Debian).value,
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffArtifactPublishPath := application,
    riffRaffPackageName := s"editorial-tools:workflow:$application",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffArtifactResources := Seq(
      riffRaffPackageType.value -> s"$application/${riffRaffPackageType.value.getName}",
      (packageBin in Universal in notificationLambda).value -> s"${(name in notificationLambda).value}/${(packageBin in Universal in notificationLambda).value.getName}",
      baseDirectory.value / "conf" / "riff-raff.yaml" -> "riff-raff.yaml"
    ),
    javaOptions in Universal ++= Seq(
      "-Dpidfile.path=/dev/null"
    ),
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>",
    packageSummary := "workflow-frontend",
    packageDescription := """Workflow, part of the suite of Guardian CMS tools"""
  )
  .settings(
    topLevelDirectory in Universal := Some(normalizedName.value),
    name in Universal := normalizedName.value
  )

lazy val notificationLambda = project("notification")
  .enablePlugins(JavaAppPackaging)
  .settings(
    name := "workflow-notification",
    topLevelDirectory in Universal := None,
    packageName in Universal := normalizedName.value,
    libraryDependencies ++= notificationDependencies
  )
  .dependsOn(commonLib % "compile->compile;test->test")

