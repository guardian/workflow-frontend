scalaVersion := "2.11.1"

addCommandAlias("dist", ";play-artifact")

addCommandAlias("runLocal", "; project prototype; run -DAPP_ENV=local -Dconfig.resource=application.local.conf 9090")

parallelExecution in Test := false
