package test

import java.util.Date
import com.gu.workflow.test.Config
import models.{Section, WorkflowContent, Flag, Stub}
import org.apache.http.entity.StringEntity
import org.apache.http.impl.client.HttpClients
import org.apache.http.client.methods.HttpGet
import org.apache.http.client.methods.HttpPost

import com.gu.pandomainauth.model.{AuthenticatedUser, User}
import com.gu.pandomainauth.service.LegacyCookie
import play.api.libs.json.{JsValue, JsObject, Json}
import play.mvc.Http.Request
import com.gu.workflow.test.lib.TestData._

trait Http {
  def authHeader:(String,String) = {
    val authed = AuthenticatedUser(User("jim", "bob", "jim@guardian.co.uk", None), "workflow", Set("workflow"),new Date().getTime + 86400 * 1000, true)
    //this test will break if localhost secret is changed in s3
    val cookieValue = LegacyCookie.generateCookieData(authed, "localdevsecret")

    val cookie = PandaCookie("gutoolsAuth", cookieValue)
    val apiHeader = ("Cookie", s"${cookie.key}=${cookie.value}")
    apiHeader

  }

  def GET(url: String, headers: Seq[(String, String)] = Seq(authHeader)): Response = {

    val client = HttpClients.createDefault()
    val request = new HttpGet(url)

    headers.foreach{
      case (key, value) => request.setHeader(key, value)
    }

    val response = client.execute(request)

    new Response(response)
  }

  def POST(url: String, json: JsValue, headers: Seq[(String, String)]=Seq(authHeader)): Response = {

    val client = HttpClients.createDefault()
    val request = new HttpPost(url)

    headers.foreach{
      case (key, value) => request.setHeader(key, value)
    }
    request.setHeader("Content-Type", "application/json");
    val jsonEntity = new StringEntity(Json.stringify(json))
    request.setEntity(jsonEntity)

    val response = client.execute(request)

    new Response(response)
  }
}
