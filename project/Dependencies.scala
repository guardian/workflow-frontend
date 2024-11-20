import sbt._

object Dependencies {
  val awsVersion: String = "1.12.767"
  val scalaTest = "org.scalatest" %% "scalatest" % "3.1.1" % "test"

  val awsDependencies = Seq(
    "com.amazonaws" % "aws-java-sdk-dynamodb" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-sts" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-ec2" % awsVersion,
    "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsVersion,
    "com.gu" %% "content-api-client-aws" % "0.7"
  )

  val authDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_3-0" % "4.0.0",
    "com.gu" %% "hmac-headers" % "2.0.0",
    "com.gu" %% "panda-hmac-play_3-0" % "4.0.0"
  )

  val testDependencies = Seq(
    scalaTest,
    "org.scalamock" %% "scalamock" % "4.4.0" % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "6.6")

  val circeVersion = "0.14.9"

  val jsonDependencies = Seq(
    "io.circe" %% "circe-core" % circeVersion,
    "io.circe" %% "circe-generic" % circeVersion,
    "io.circe" %% "circe-parser" % circeVersion,
    "io.circe" %% "circe-generic-extras" % "0.14.4",
    "com.beachape" %% "enumeratum-circe" % "1.7.4"
  )

  val cacheDependencies = Seq(
    "com.github.blemale" %% "scaffeine" % "5.2.1"
  )

  val cryptoDependencies = Seq(
    "org.bouncycastle" % "bcprov-jdk18on" % "1.78.1"
  )

  val permissionsClientVersion = "4.0.0-PREVIEW.pflogmarkers-for-client-casuals.2024-11-20T1111.6351c7ed"

  val permissionsDependencies = Seq(
    "com.gu" %% "editorial-permissions-client" % permissionsClientVersion
  )
}
