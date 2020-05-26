import sbt._
import play.Play.autoImport._
import PlayKeys._

object Dependencies {
  val awsVersion: String = "1.11.259"
  val scalaTest = "org.scalatest" %% "scalatest" % "2.2.4" % "test"

  val notificationDependencies = Seq(
    scalaTest,
    "com.lihaoyi" %% "requests" % "0.1.4",
    "org.bouncycastle" % "bcprov-jdk15on" % "1.58",
    "com.amazonaws" % "aws-lambda-java-core" % "1.1.0"
  )

  val playDependencies = Seq(ws, "com.typesafe.play" %% "play-json" % "2.4.11")

  val awsDependencies = Seq(
    "com.gu" % "kinesis-logback-appender" % "1.3.0",
    "com.amazonaws" % "aws-java-sdk-dynamodb" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-sts" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-ec2" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsVersion,
    "com.gu" %% "content-api-client-aws" % "0.5"
  )

  val akkaDependencies = Seq(
    "com.typesafe.akka" %% "akka-agent" % "2.4.7",
    "com.typesafe.akka" %% "akka-slf4j" % "2.4.0"
  )

  val authDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_2-4-0" % "0.5.1",
    "com.gu" %% "hmac-headers" % "1.1.2"
  )

  val testDependencies = Seq(
    scalaTest,
    "org.seleniumhq.selenium" % "selenium-java" % "2.35.0" % "test",
    "org.scalatestplus" %% "play" % "1.2.0" % "test",
    "org.apache.httpcomponents" % "httpclient" % "4.5.2",
    specs2 % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "6.3")

  val circeVersion = "0.8.0"

  val jsonDependencies = Seq(
    "io.circe" %% "circe-core" % circeVersion,
    "io.circe" %% "circe-generic" % circeVersion,
    "io.circe" %% "circe-parser" % circeVersion,
    "io.circe" %% "circe-generic-extras" % circeVersion,
    "com.beachape" %% "enumeratum-circe" % "1.5.14"
  )

  val webPushDependencies = Seq(
    "nl.martijndwars" % "web-push" % "3.1.1"
  )
}
