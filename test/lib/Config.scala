package test

import play.api.test.Helpers

object Config {
  val awsKey: String = sys.env.get("AWS_ACCESS_KEY").get
  val awsSecret: String = sys.env.get("AWS_SECRET_KEY").get

  val dbName: String = sys.env.get("WF_DB_NAME").getOrElse("default")
  val dbUrl: String = sys.env.get("WF_DB_URL").get
  val dbUser: String = sys.env.get("WF_DB_USER").get
  val dbPass: String = sys.env.get("WF_DB_PASS").get

  val pandaConfig = PandaConfig("workflow", "localhost", awsKey, awsSecret)
  val pandaUser   = PandaUser("jim@guardian.co.uk", "jim", "bob")
  val pandaCookie = PandaCookie(pandaUser, pandaConfig)

  val appConfig = Map(
    "logging.logstash.enabled" -> false,
    "aws.key"                  -> awsKey,
    "aws.secret"               -> awsSecret,
    "pandomain.aws.keyId"      -> awsKey,
    "pandomain.aws.secret"     -> awsSecret,
    "db.default.url"           -> (dbUrl ++ dbName),
    "db.default.user"          -> dbUser,
    "db.default.password"      -> dbPass,
    "host"                     -> s"http://localhost:${Helpers.testServerPort}"
  )
}
