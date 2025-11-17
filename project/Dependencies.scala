import sbt._

object Dependencies {
  val awsVersion: String = "2.38.5"
  val scalaTest = "org.scalatest" %% "scalatest" % "3.1.4" % "test"

  val awsDependencies = Seq(
    "software.amazon.awssdk" % "dynamodb" % awsVersion,
    "software.amazon.awssdk" % "dynamodb-enhanced" % awsVersion,
    "software.amazon.awssdk" % "sts" % awsVersion,
    "software.amazon.awssdk" % "ec2" % awsVersion,
    "software.amazon.awssdk" % "cloudwatch" % awsVersion,
    "software.amazon.awssdk" % "s3" % awsVersion,
    "software.amazon.awssdk" % "imds" % awsVersion,
    "com.gu" %% "content-api-client-aws" % "1.0.1",
    "joda-time" % "joda-time" % "2.14.0"
  )

  val pandaVersion = "12.0.0"

  val authDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_3-0" % pandaVersion,
    "com.gu" %% "hmac-headers" % "2.0.0",
    "com.gu" %% "panda-hmac-play_3-0" % pandaVersion
  )

  val testDependencies = Seq(
    scalaTest,
    "org.scalamock" %% "scalamock" % "7.5.2" % Test
  )

  val logbackDependencies = Seq("net.logstash.logback" % "logstash-logback-encoder" % "6.6")

  val circeVersion = "0.14.15"

  val jsonDependencies = Seq(
    "io.circe" %% "circe-core" % circeVersion,
    "io.circe" %% "circe-generic" % circeVersion,
    "io.circe" %% "circe-parser" % circeVersion,
    "io.circe" %% "circe-generic-extras" % "0.14.4",
    "com.beachape" %% "enumeratum-circe" % "1.7.5"
  )

  val cacheDependencies = Seq(
    "com.github.blemale" %% "scaffeine" % "5.2.1"
  )

  val cryptoDependencies = Seq(
    "org.bouncycastle" % "bcprov-jdk18on" % "1.78.1"
  )

  val permissionsClientVersion = "5.0.0"

  val permissionsDependencies = Seq(
    "com.gu" %% "editorial-permissions-client" % permissionsClientVersion
  )
}
