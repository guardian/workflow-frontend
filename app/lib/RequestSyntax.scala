package lib

import play.api.mvc.RequestHeader


object RequestSyntax {

  implicit class RequestHeaderOps(self: RequestHeader) {

    def forwardedProtocol: Option[String] =
      self.headers.get("X-Forwarded-Proto")

    def isSecure: Boolean = forwardedProtocol == Some("https")
  }

}
