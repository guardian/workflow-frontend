import com.gu.deploy.PlayArtifact._
import sbt._
import sbt.Keys._
import play.Play.autoImport._
import PlayKeys._
import com.typesafe.sbt.web._
import com.typesafe.sbt.web.Import._
import Dependencies._


object WorkflowBuild extends Build {

  val commonSettings =
    Seq(
      scalaVersion := "2.10.4",
      scalaVersion in ThisBuild := "2.10.4",
      organization := "com.gu",
      version      := "0.1",
      fork in Test := false,
      resolvers ++= Seq("Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/"),
      scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings"),
      doc in Compile <<= target.map(_ / "none"),
      incOptions := incOptions.value.withNameHashing(nameHashing = true)
    )

  lazy val commonLib = project("common-lib")
    .settings(
      libraryDependencies ++= databaseDependencies
    )

  lazy val prole = playProject("prole")
                  .settings(libraryDependencies ++= awsDependencies ++ testDependencies)

  lazy val root = playProject("prototype")
    .settings(
      libraryDependencies ++= databaseDependencies ++ akkaDependencies ++ awsDependencies ++ googleOAuthDependencies,
      requireJs += "main.js",
      requireJsShim += "main.js"
    )

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
