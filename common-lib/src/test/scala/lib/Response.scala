package com.gu.workflow.test

import org.apache.http.client.methods.{CloseableHttpResponse}
import scala.io.Source


class Response(val response: CloseableHttpResponse) {
  lazy val body = Source.fromInputStream(response.getEntity.getContent).getLines().mkString("")
  lazy val responseCode = response.getStatusLine.getStatusCode
  lazy val responseMessage = response.getStatusLine.getReasonPhrase

  def header(name: String) = response.getFirstHeader(name).getValue

  def disconnect() { response.close() }
}
