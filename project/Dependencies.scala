import sbt._
import play.Keys.jdbc

object Dependencies {

  val databaseDependencies = Seq(
    jdbc,
    "com.typesafe.play" %% "play-slick" % "0.6.0.1",
    "com.github.tototoshi" %% "slick-joda-mapper" % "1.1.0",
    "org.postgresql" % "postgresql" % "9.3-1100-jdbc4"
  )

  val awsDependencies = Seq("com.amazonaws" % "aws-java-sdk" % "1.7.5")

  val akkaDependencies = Seq("com.typesafe.akka" %% "akka-agent" % "2.2.0")

  val googleOAuthDependencies = Seq("com.gu" %% "play-googleauth" % "0.0.2")

}
