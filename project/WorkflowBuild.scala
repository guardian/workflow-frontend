import com.gu.deploy.PlayArtifact._
import sbt._
import sbt.Keys._
import play.Play.autoImport._
import PlayKeys._
import com.typesafe.sbt.web._
import com.gu.riffraff.artifact.RiffRaffArtifact
import com.gu.riffraff.artifact.RiffRaffArtifact.autoImport._
import com.typesafe.sbt.SbtNativePackager._
import com.typesafe.sbt.packager.debian.JDebPackaging
import com.typesafe.sbt.packager.archetypes.JavaAppPackaging
import com.typesafe.sbt.packager.archetypes.ServerLoader.Systemd
import com.typesafe.sbt.packager.Keys._
import Dependencies._
import com.typesafe.sbt.SbtNativePackager.autoImport.packageName
import com.typesafe.sbt.packager.universal.UniversalPlugin.autoImport.topLevelDirectory
import sbtbuildinfo.Plugin._

object WorkflowBuild extends Build {

  def buildInfoPlugin = buildInfoSettings ++ Seq(
    sourceGenerators in Compile <+= buildInfo,
    buildInfoKeys := Seq[BuildInfoKey](
      name,
      BuildInfoKey.constant("buildNumber", Option(System.getenv("BUILD_NUMBER")) getOrElse "DEV"),
      BuildInfoKey.constant("buildTime", System.currentTimeMillis),
      BuildInfoKey.constant("gitCommitId", Option(System.getenv("BUILD_VCS_NUMBER")) getOrElse(try {
        "git rev-parse HEAD".!!.trim
      } catch {
        case e: Exception => "unknown"
      }))
    ),
    buildInfoPackage := "build"
  )

  val commonSettings =
    Seq(
      scalaVersion := "2.11.11",
      scalaVersion in ThisBuild := "2.11.11",
      organization := "com.gu",
      version      := "0.1",
      fork in Test := false,
      resolvers ++= Seq(
        "Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/",
        "scalaz-bintray" at "https://dl.bintray.com/scalaz/releases"
      ),
      scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings"),
      doc in Compile <<= target.map(_ / "none"),
      incOptions := incOptions.value.withNameHashing(nameHashing = true)
    ) ++ buildInfoPlugin

  lazy val commonLib = project("common-lib")
    .settings(
      libraryDependencies ++= akkaDependencies ++ logbackDependencies ++ testDependencies ++ playDependencies ++ awsDependencies ++ jsonDependencies
    )

  def appDistSettings(application: String, deployJsonDir: Def.Initialize[File] = baseDirectory) = Seq(
    packageName in Universal := application,
    concurrentRestrictions in Universal := List(Tags.limit(Tags.All, 1)),
    javaOptions in Universal ++= Seq(
      // Since play uses separate pidfile we have to provide it with a proper path
      // name of the pid file must be play.pid
      s"-Dpidfile.path=/var/run/${packageName.value}/play.pid"
    ),
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    riffRaffPackageType := (packageBin in Debian).value,
    riffRaffBuildIdentifier := Option(System.getenv("CIRCLE_BUILD_NUM")).getOrElse("dev"),
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
    artifactName in Universal := { (sv: ScalaVersion, module: ModuleID, artifact: Artifact) =>
      artifact.name + "." + artifact.extension
    },
    javaOptions in Universal ++= Seq(
      "-Dpidfile.path=/dev/null"
    ),
    riffRaffManifestBranch := Option(System.getenv("CIRCLE_BRANCH")).getOrElse("dev"),
    debianPackageDependencies := Seq("openjdk-8-jre-headless"),
    serverLoading in Debian := Systemd,
    maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>",
    packageSummary := "workflow-frontend",
    packageDescription := """Workflow, part of the suite of Guardian CMS tools"""
  )

  lazy val root = playProject("workflow-frontend")
    .enablePlugins(RiffRaffArtifact, JDebPackaging)
    .settings(libraryDependencies ++= akkaDependencies ++ awsDependencies ++ googleOAuthDependencies
      ++ testDependencies ++ jsonDependencies ++ webPushDependencies)
    .settings(libraryDependencies += filters)
    .settings(playDefaultPort := 9090)
    .settings(playArtifactDistSettings ++ playArtifactSettings: _*)
    .settings(appDistSettings("workflow-frontend"): _*)
    .settings(
      topLevelDirectory in Universal := Some(normalizedName.value),
      name in Universal := normalizedName.value
    )

  def project(path: String): Project =
    Project(path, file(path)).settings(commonSettings: _*)

  def playProject(path: String): Project =
    Project(path, file(".")).enablePlugins(play.PlayScala).enablePlugins(SbtWeb)
      .settings(libraryDependencies += ws)
      .settings(commonSettings: _*)
      .settings(magentaPackageName := path)
      .dependsOn(commonLib)
      .dependsOn(commonLib % "test->test")

  lazy val notificationLambda = project("notification")
    .enablePlugins(JavaAppPackaging)
    .settings(
      name := "workflow-notification",
      topLevelDirectory in Universal := None,
      packageName in Universal := normalizedName.value,
      libraryDependencies ++= notificationDependencies
    )
    .dependsOn(commonLib % "compile->compile;test->test")

  def playArtifactSettings = Seq(
    ivyXML :=
      <dependencies>
        <exclude org="commons-logging"/>
        <exclude org="org.springframework"/>
        <exclude org="org.scala-tools.sbt"/>
      </dependencies>
  )
}
