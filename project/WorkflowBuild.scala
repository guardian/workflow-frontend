import sbt._
import sbt.Keys._
import play.Keys._
import plugins.PlayArtifact._
import sbtassembly.Plugin.{AssemblyKeys, MergeStrategy}
import AssemblyKeys._
import Dependencies._


object WorkflowBuild extends Build {

  val commonSettings =
    Seq(
      scalaVersion := "2.10.3",
      scalaVersion in ThisBuild := "2.10.3",
      organization := "com.gu",
      version      := "0.1",
      fork in Test := false,
      resolvers ++= Seq("Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/"),
      scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings")
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
    play.Project(path, path = file(path))
      .settings(commonSettings ++ playArtifactDistSettings ++ playArtifactSettings: _*)
      .settings(magentaPackageName := path)
      .dependsOn(commonLib)

  def playArtifactSettings = Seq(
    ivyXML :=
      <dependencies>
        <exclude org="commons-logging"/>
        <exclude org="org.springframework"/>
        <exclude org="org.scala-tools.sbt"/>
      </dependencies>,
    mergeStrategy in assembly <<= (mergeStrategy in assembly) { old => {
      case f if f.startsWith("org/apache/lucene/index/") => MergeStrategy.first
      case "play/core/server/ServerWithStop.class" => MergeStrategy.first
      case "ehcache.xml" => MergeStrategy.first
      case x => old(x)
    }}
  )

}
