package com.gu.workflow.test

import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse
import scala.io.Source


class Response(val response: CloseableHttpResponse) {
  lazy val body = Source.fromInputStream(response.getEntity.getContent).getLines().mkString("")
  lazy val responseCode = response.getCode()
  lazy val responseMessage = response.getReasonPhrase()

  def header(name: String) = response.getFirstHeader(name).getValue

  def disconnect(): Unit = { response.close() }
}
