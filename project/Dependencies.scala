import sbt._
import play.Play.autoImport._
import PlayKeys._

object Dependencies {

  val playDependencies = Seq(ws, "com.typesafe.play" %% "play-json" % "2.4.8")

  val awsDependencies = Seq(
    "com.amazonaws" % "aws-java-sdk" % "1.11.8",
    "com.gu" % "kinesis-logback-appender" % "1.3.0"
  )

  val akkaDependencies = Seq(
    "com.typesafe.akka" %% "akka-agent" % "2.4.7",
    "com.typesafe.akka" %% "akka-slf4j" % "2.4.0"
  )

  val googleOAuthDependencies = Seq("com.gu" %% "pan-domain-auth-play_2-4-0" % "0.4.0")

  val testDependencies = Seq(
    "org.scalatest" %% "scalatest" % "2.2.4" % "test",
    "org.seleniumhq.selenium" % "selenium-java" % "2.35.0" % "test",
    "org.scalatestplus" %% "play" % "1.2.0" % "test",
    "org.apache.httpcomponents" % "httpclient" % "4.5.2",
    "com.gu" %% "pan-domain-auth-play_2-4-0" % "0.4.0",
    specs2 % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "4.5")

}
