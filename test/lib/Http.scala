package test

import org.apache.http.impl.client.HttpClients
import org.apache.http.client.methods.HttpGet


trait Http {
  def GET(url: String, headers: Seq[(String, String)] = Nil): Response = {

    val cookie = Config.pandaCookie
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
