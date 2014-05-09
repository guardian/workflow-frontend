package lib

import java.net.URI
import scala.concurrent.Future
import play.api.mvc.{Results, SimpleResult, RequestHeader, Filter}


object RedirectToHTTPSFilter extends Filter {

  /** Uses the X-Forwarded-Proto header (added by Amazon's ELB) to determine whether
    * the client used HTTPS, and redirect if not.
    *
    * Assumes untrusted clients can only connect via the ELB!
    */
  def apply(f: (RequestHeader) => Future[SimpleResult])(request: RequestHeader): Future[SimpleResult] =
    if (request.headers.get("X-Forwarded-Proto").exists(_ != "https")) {
      val queryString = Some(request.rawQueryString).filter(_.nonEmpty)
      val uri = new URI("https", request.host, request.path, queryString.orNull, null)
      Future.successful(Results.MovedPermanently(uri.toString))
    }
    else f(request)

}
