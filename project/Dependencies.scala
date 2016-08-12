import sbt._
import play.Play.autoImport._
import PlayKeys._

object Dependencies {

  val playDependencies = Seq(ws, "com.typesafe.play" %% "play-json" % "2.3.4")

  val awsDependencies = Seq("com.amazonaws" % "aws-java-sdk" % "1.9.32")

  val akkaDependencies = Seq("com.typesafe.akka" %% "akka-agent" % "2.3.4")

  val googleOAuthDependencies = Seq("com.gu" %% "pan-domain-auth-play_2-4-0" % "0.3.0")

  val testDependencies = Seq(
    "org.scalatest" %% "scalatest" % "2.2.4" % "test",
    "org.seleniumhq.selenium" % "selenium-java" % "2.35.0" % "test",
    "org.scalatestplus" %% "play" % "1.2.0" % "test",
    "org.apache.httpcomponents" % "httpclient" % "4.3.4",
    "com.gu" %% "pan-domain-auth-play" % "0.2.9",
    specs2 % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "4.2")

}
