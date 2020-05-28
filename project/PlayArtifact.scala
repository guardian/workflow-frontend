package com.gu.deploy

import sbt._
import sbt.Keys._
import com.typesafe.sbt.SbtNativePackager._
import com.typesafe.sbt.packager.Keys._

object PlayArtifact extends Plugin {

  val playArtifact = TaskKey[File]("play-artifact", "Builds a deployable zip file for magenta")
  val playArtifactResources = TaskKey[Seq[(File, String)]]("play-artifact-resources", "Files that will be collected by the deployment-artifact task")
  val playArtifactFile = SettingKey[String]("play-artifact-file", "Filename of the artifact built by deployment-artifact")

  val magentaPackageName = SettingKey[String]("magenta-package-name", "Name of the magenta package")

  lazy val playArtifactDistSettings = Seq(
    name in Universal := name.value,

    playArtifactResources := Seq(
      // upstart config file
      baseDirectory.value / (magentaPackageName.value + ".conf") ->
        (s"packages/${magentaPackageName.value}/${magentaPackageName.value}.conf"),

      // the uberjar
      dist.value -> s"packages/${magentaPackageName.value}/${dist.value.getName}",

      // Cloud Formation template
      baseDirectory.value / "cfn" / s"${name.value}.json" -> s"packages/cloud-formation/${name.value}.json",

      // and the riff raff deploy instructions
      baseDirectory.value / "conf" / "deploy.json" -> "deploy.json"
    ),

    playArtifactFile := "artifacts.zip",
    playArtifact := {
      val distFile = target.value / playArtifactFile.value
      streams.value.log.info("Disting " + distFile)

      if (distFile.exists()) {
        distFile.delete()
      }
      IO.zip(playArtifactResources.value, distFile)

      streams.value.log.info("Done disting.")
      distFile
    }
  )
}
