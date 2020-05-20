package lib

import config.Config.defaultExecutionContext
import play.api.mvc.{Action, BodyParser, Request, Result}

import scala.concurrent.{ExecutionContext, Future}

case class CORSable[A](allowedOrigins: Set[String])(action: Action[A]) extends Action[A] {
  def apply(request: Request[A]): Future[Result] = {
    val headers = request.headers.get("Origin").map { origin =>
      if(allowedOrigins.contains(origin)) {
        List("Access-Control-Allow-Origin" -> origin, "Access-Control-Allow-Credentials" -> "true")
      } else { Nil }
    }

    action(request).map(_.withHeaders(headers.getOrElse(Nil) :_*))
  }

  lazy val parser: BodyParser[A] = action.parser

  override def executionContext: ExecutionContext = config.Config.defaultExecutionContext
}
