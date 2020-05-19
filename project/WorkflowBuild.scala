import com.gu.riffraff.artifact.BuildInfo
import sbt.Keys._
import sbt._

object WorkflowBuild {
//  lazy val buildInfoSettings = Seq(
//    buildInfoPackage := "build",
//    buildInfoKeys ++= {
//      val buildInfo = BuildInfo(baseDirectory.value)
//
//      Seq[BuildInfoKey](
//        "gitCommitId" -> buildInfo.revision,
//        "buildNumber" -> buildInfo.buildIdentifier
//      )
//    }
//  )

  val scalaVersionNumber = "2.12.11"

  val commonSettings =
    Seq(
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
}
