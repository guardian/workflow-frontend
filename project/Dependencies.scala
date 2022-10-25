import sbt._

object Dependencies {
  val awsVersion: String = "1.12.129"
  val scalaTest = "org.scalatest" %% "scalatest" % "3.1.1" % "test"

  val notificationDependencies = Seq(
    scalaTest,
    "com.lihaoyi" %% "requests" % "0.5.1",
    "org.bouncycastle" % "bcprov-jdk15on" % "1.65",
    "com.amazonaws" % "aws-lambda-java-core" % "1.2.1"
  )

  val awsDependencies = Seq(
    "com.gu" % "kinesis-logback-appender" % "1.4.4",
    "com.amazonaws" % "aws-java-sdk-dynamodb" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-sts" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-ec2" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsVersion,
    "com.gu" %% "content-api-client-aws" % "0.7"
  )

  val jacksonDependencyOverrides: Seq[ModuleID] = {
    val version = "2.11.4"
    Seq(
        "com.fasterxml.jackson.core" % "jackson-core" % version,
        "com.fasterxml.jackson.core" % "jackson-databind" % version,
        "com.fasterxml.jackson.dataformat" % "jackson-dataformat-cbor" % version
    )
  }

  val akkaDependencies = Seq(
    // akka-agent 2.5.X has deprecated Agents,
    // so use the latest version that still has it
    // TODO move to latest version of akka-agent
    "com.typesafe.akka" %% "akka-agent" % "2.4.20",
    "com.typesafe.akka" %% "akka-slf4j" % "2.4.20"
  )

  val authDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_2-8" % "1.2.0",
    "com.gu" %% "hmac-headers" % "1.2.0",
    "com.gu" %% "panda-hmac-play_2-8" % "2.1.0"
  )

  val testDependencies = Seq(
    scalaTest,
    "org.scalamock" %% "scalamock" % "4.4.0" % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "6.6")

  val circeVersion = "0.13.0"

  val jsonDependencies = Seq(
    "io.circe" %% "circe-core" % circeVersion,
    "io.circe" %% "circe-generic" % circeVersion,
    "io.circe" %% "circe-parser" % circeVersion,
    "io.circe" %% "circe-generic-extras" % circeVersion,
    "com.beachape" %% "enumeratum-circe" % "1.6.0"
  )

  val webPushDependencies = Seq(
    "nl.martijndwars" % "web-push" % "5.1.0"
  )

  val cacheDependencies = Seq(
    "com.github.cb372" %% "scalacache-caffeine" % "0.9.3"
  )

  val cryptoDependencies = Seq(
    "org.bouncycastle" % "bcprov-jdk15on" % "1.60"
  )

  val permissionsClientVersion = "2.0"

  val permissionsDependencies = Seq(
    "com.gu" %% "editorial-permissions-client" % permissionsClientVersion
  )
}
