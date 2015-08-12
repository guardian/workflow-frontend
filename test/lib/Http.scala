package test

import java.util.Date
import com.gu.workflow.test.Config
import org.apache.http.impl.client.HttpClients
import org.apache.http.client.methods.HttpGet

import com.gu.pandomainauth.model.{AuthenticatedUser, User}
import com.gu.pandomainauth.service.LegacyCookie

trait Http {
  def GET(url: String, headers: Seq[(String, String)] = Nil): Response = {

    val authed = AuthenticatedUser(User("jim", "bob", "jim@guardian.co.uk", None), "workflow", Set("workflow"),new Date().getTime + 86400 * 1000, true)
    //this test will break if localhost secret is changed in s3
    val cookieValue = LegacyCookie.generateCookieData(authed, "devsecret")

    val cookie = PandaCookie("gutoolsAuth", cookieValue)
    val apiHeader = ("Cookie", s"${cookie.key}=${cookie.value}")

    val client = HttpClients.createDefault()
    val request = new HttpGet(url)

    (headers :+ apiHeader).foreach{
      case (key, value) => request.setHeader(key, value)
    }

    val response = client.execute(request)

    new Response(response)
  }
}
