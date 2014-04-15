name := "workflow"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  "com.amazonaws" % "aws-java-sdk" % "1.7.5",
  "com.typesafe.akka" %% "akka-agent" % "2.2.0"
)     

play.Project.playScalaSettings
