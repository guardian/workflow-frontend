// Comment to get more information during initialization
logLevel := Level.Warn

// The Typesafe repository
resolvers += "Typesafe repository" at "https://repo.typesafe.com/typesafe/releases/"

libraryDependencies += "org.vafer" % "jdeb" % "1.8" artifacts (Artifact("jdeb", "jar", "jar"))

addSbtPlugin("com.gu" % "sbt-riffraff-artifact" % "1.1.9")

// Use the Play sbt plugin for Play projects
addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.7.4")

addSbtPlugin("com.eed3si9n" % "sbt-buildinfo" % "0.9.0")

addSbtPlugin("net.virtual-void" % "sbt-dependency-graph" % "0.9.2")

