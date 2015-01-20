import com.gu.deploy.PlayArtifact._
import sbt._
import sbt.Keys._
import play.Play.autoImport._
import PlayKeys._
import com.typesafe.sbt.web._
import Dependencies._
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
    buildInfoPackage := "prototype"
  )

  val commonSettings =
    Seq(
      scalaVersion := "2.11.1",
      scalaVersion in ThisBuild := "2.11.1",
      organization := "com.gu",
      version      := "0.1",
      fork in Test := false,
      resolvers ++= Seq("Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/"),
      scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings"),
      doc in Compile <<= target.map(_ / "none"),
      incOptions := incOptions.value.withNameHashing(nameHashing = true)
    ) ++ buildInfoPlugin

  lazy val commonLib = project("common-lib")
    .settings(
      libraryDependencies ++= databaseDependencies ++ akkaDependencies
    )

  lazy val prole = playProject("prole")
                  .settings(libraryDependencies ++= awsDependencies ++ testDependencies)
                  .settings(playDefaultPort := 9091)


  lazy val root = playProject("prototype")
    .settings(
      libraryDependencies ++= databaseDependencies ++ akkaDependencies ++ awsDependencies ++ googleOAuthDependencies
      ++ apiDocDependencies
    )
    .settings(FrontEnd.PrototypeProject.settings: _*)
    .settings(playDefaultPort := 9090)

  def project(path: String): Project =
    Project(path, file(path)).settings(commonSettings: _*)

  def playProject(path: String): Project =
    Project(path, file(path)).enablePlugins(play.PlayScala).enablePlugins(SbtWeb)
      .settings(libraryDependencies += ws)
      .settings(commonSettings ++ playArtifactDistSettings ++ playArtifactSettings: _*)
      .settings(magentaPackageName := path)
      .dependsOn(commonLib)

  def playArtifactSettings = Seq(
    ivyXML :=
      <dependencies>
        <exclude org="commons-logging"/>
        <exclude org="org.springframework"/>
        <exclude org="org.scala-tools.sbt"/>
      </dependencies>
  )

}
