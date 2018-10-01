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
import com.typesafe.sbt.packager.archetypes.ServerLoader.Systemd
import com.typesafe.sbt.packager.Keys._
import com.tapad.docker.DockerComposePlugin
import com.tapad.docker.DockerComposePlugin.autoImport._
import sbtbuildinfo.Plugin._
import sbtdocker.DockerPlugin
import sbtdocker.DockerPlugin.autoImport._

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

  val circeVersion = "0.8.0"

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
      libraryDependencies ++=
        Seq(
          ws,
          "com.typesafe.play" %% "play-json" % "2.4.11",
          "com.gu" % "kinesis-logback-appender" % "1.3.0",
          "com.amazonaws" % "aws-java-sdk-ec2" % "1.11.259",
          "com.amazonaws" % "aws-java-sdk-dynamodb" % "1.11.259",
          "com.amazonaws" % "aws-java-sdk-sts" % "1.11.259",
          "com.typesafe.akka" %% "akka-agent" % "2.4.7",
          "com.typesafe.akka" %% "akka-slf4j" % "2.4.0",
          "net.logstash.logback" % "logstash-logback-encoder" % "4.5",
          "io.circe" %% "circe-core" % circeVersion,
          "io.circe" %% "circe-generic" % circeVersion,
          "io.circe" %% "circe-parser" % circeVersion,
          "io.circe" %% "circe-generic-extras" % circeVersion,
          "com.beachape" %% "enumeratum-circe" % "1.5.14",
          "org.scalatest" %% "scalatest" % "2.2.4" % "test",
          "org.seleniumhq.selenium" % "selenium-java" % "2.35.0" % "test",
          "org.scalatestplus" %% "play" % "1.2.0" % "test",
          specs2 % Test
        )
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
    .settings(libraryDependencies ++= Seq(
      filters,
      "com.amazonaws" % "aws-java-sdk-dynamodb" % "1.11.259",
      "com.amazonaws" % "aws-java-sdk-sts" % "1.11.259",
      "com.gu" %% "content-api-client-aws" % "0.5",
      "com.gu" %% "pan-domain-auth-play_2-4-0" % "0.5.0",
      "io.circe" %% "circe-core" % circeVersion,
      "io.circe" %% "circe-generic" % circeVersion,
      "com.beachape" %% "enumeratum-circe" % "1.5.14",
      "org.scalatest" %% "scalatest" % "2.2.4" % "test",
      "org.seleniumhq.selenium" % "selenium-java" % "2.35.0" % "test",
      "org.scalatestplus" %% "play" % "1.2.0" % "test",
      specs2 % Test
    ))
    .settings(playDefaultPort := 9090)
    .settings(playArtifactDistSettings ++ playArtifactSettings: _*)
    .settings(appDistSettings("workflow-frontend"): _*)
    .settings(
      topLevelDirectory in Universal := Some(normalizedName.value),
      name in Universal := normalizedName.value,
      dockerImageCreationTask := (publishLocal in Docker).value,
      dockerfile in docker := {
        new Dockerfile {
          val dockerAppPath = "/app/"
          val mainClassString = (mainClass in Compile).value.get
          val classpath = (fullClasspath in Compile).value
          from("java")
          add(classpath.files, dockerAppPath)
          entryPoint("java", "-cp", s"$dockerAppPath:$dockerAppPath/*", s"$mainClassString")
        }
      }
    )

  def project(path: String): Project =
    Project(path, file(path)).settings(commonSettings: _*)

  def playProject(path: String): Project =
    Project(path, file("."))
      .enablePlugins(play.PlayScala)
      .enablePlugins(SbtWeb)
      .enablePlugins(DockerPlugin, DockerComposePlugin)
      .settings(commonSettings: _*)
      .settings(magentaPackageName := path)
      .dependsOn(commonLib)
      .dependsOn(commonLib % "test->test")

  def playArtifactSettings = Seq(
    ivyXML :=
      <dependencies>
        <exclude org="commons-logging"/>
        <exclude org="org.springframework"/>
        <exclude org="org.scala-tools.sbt"/>
      </dependencies>
  )
}
