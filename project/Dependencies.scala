import sbt._
import play.Play.autoImport._
import PlayKeys._

object Dependencies {

  val databaseDependencies = Seq(
    jdbc,
    "com.typesafe.play" %% "play-slick" % "0.8.1",
    "com.github.tototoshi" %% "slick-joda-mapper" % "1.2.0",
    "org.postgresql" % "postgresql" % "9.3-1100-jdbc4"
  )

  val awsDependencies = Seq("com.amazonaws" % "aws-java-sdk" % "1.7.5")

  val akkaDependencies = Seq("com.typesafe.akka" %% "akka-agent" % "2.3.4")

  val googleOAuthDependencies = Seq("com.gu" %% "pan-domain-auth-play" % "0.2.2")

  val testDependencies = Seq("org.scalatest" %% "scalatest" % "2.1.5" % "test")

  val apiDocDependencies = Seq("com.wordnik" %% "swagger-play2" % "1.3.12")

  val logbackDependencies = Seq("net.logstash.logback" %% "logstash-logback-encoder" % "4.1-SNAPSHOT")

}
