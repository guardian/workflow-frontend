package test

import java.util.Date

import com.gu.pandomainauth.model.{AuthenticatedUser, User}
import com.gu.pandomainauth.service.LegacyCookie
import play.api.test.Helpers

object Config {
  val awsKey: String = sys.env.get("AWS_ACCESS_KEY").get
  val awsSecret: String = sys.env.get("AWS_SECRET_KEY").get

  val dbName: String = sys.env.get("WF_DB_NAME").getOrElse("default")
  val dbUrl: String = sys.env.get("WF_DB_URL").get
  val dbUser: String = sys.env.get("WF_DB_USER").get
  val dbPass: String = sys.env.get("WF_DB_PASS").get
  def dbFullUrl: String = {
    val s = dbUrl ++ dbName
    println(s"Connecting to database: $s")
    s
  }
  val dropDB: Boolean = sys.env.get("WF_DROP_DB").map(_ == "yes").getOrElse(true)
  val randomSeed: Option[Long] = sys.env.get("WF_RANDOM_SEED").map(_.toLong)

  val authed = AuthenticatedUser(User("jim", "bob", "jim@guardian.co.uk", None), "workflow", Set("workflow"),new Date().getTime + 86400 * 1000, true)
  //this test will break if localhost secret is changed in s3q
  val cookieValue = LegacyCookie.generateCookieData(authed, "devsecret")

  val pandaCookie = PandaCookie("gutoolsAuth", cookieValue)

  val appConfig = Map(
    "logging.logstash.enabled" -> false,
    "aws.key"                  -> awsKey,
    "aws.secret"               -> awsSecret,
    "pandomain.aws.keyId"      -> awsKey,
    "pandomain.aws.secret"     -> awsSecret,
    "db.default.url"           -> dbFullUrl,
    "db.default.user"          -> dbUser,
    "db.default.password"      -> dbPass,
    "host"                     -> s"http://localhost:${Helpers.testServerPort}"
  )
}
