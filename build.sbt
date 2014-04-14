name := "workflow"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  "com.amazonaws" % "aws-java-sdk" % "1.7.5"
)     

play.Project.playScalaSettings
