import sbt._
import sbt.Keys._
import plugins.PlayArtifact._
import sbtassembly.Plugin.{AssemblyKeys, MergeStrategy}
import AssemblyKeys._

object WorkflowBuild extends Build {

  val commonSettings =
    Seq(
      scalaVersion := "2.10.3",
      scalaVersion in ThisBuild := "2.10.3",
      organization := "com.gu",
      version      := "0.1",
      resolvers ++= Seq("Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/"),
      scalacOptions ++= Seq("-feature", "-deprecation", "-language:higherKinds", "-Xfatal-warnings")
    )

  val root = playProject("prototype", ".")
    .settings(libraryDependencies ++= Seq(
      "com.amazonaws" % "aws-java-sdk" % "1.7.5",
      "com.typesafe.akka" %% "akka-agent" % "2.2.0"
    ))

  def playProject(name: String, path: String): Project =
    play.Project(name, path = file(path))
      .settings(commonSettings ++ playArtifactDistSettings ++ playArtifactSettings: _*)
      .settings(magentaPackageName := "workflow-" + name)

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
