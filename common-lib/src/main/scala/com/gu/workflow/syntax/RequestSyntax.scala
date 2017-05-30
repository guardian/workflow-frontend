package com.gu.workflow.syntax

import play.api.mvc.RequestHeader

trait RequestSyntax {

  implicit class RequestHeaderOps(self: RequestHeader) {

    def forwardedProtocol: Option[String] =
      self.headers.get("X-Forwarded-Proto")

    def isSecure: Boolean = forwardedProtocol.contains("https")
  }
}

object RequestSyntax extends RequestSyntax
