package lib

import com.gu.workflow.util.LoggingContext
import LoggingContext.{withContext, withMDCExecutionContext}
import play.api.Logger
import play.api.mvc._
import scala.concurrent.Future

object LoggingFilter extends Filter {
  def apply(nextFilter: (RequestHeader) => Future[Result])
           (requestHeader: RequestHeader): Future[Result] = {
    val startTime = System.currentTimeMillis
    val headers = requestHeader.headers.getAll(LoggingContext.LOGGING_CONTEXT_HEADER)
      // TODO - !! just reading the first header for now
      .headOption.map(LoggingContext.fromHeader(_)).getOrElse(Map.empty[String, String])

    LoggingContext.withContext(headers) {
      LoggingContext.withMDCExecutionContext(PrototypeConfiguration.defaultExecutionContext) { implicit ec =>
        // use an new implicit execution context that will stash the
        // current MDC, and then apply to all threads that are
        // associated with this request

        nextFilter(requestHeader).map { result =>
          val endTime = System.currentTimeMillis
          val requestTime = endTime - startTime

          Logger.info(
            s"(${result.header.status}) ${requestHeader.method} ${requestHeader.uri} " +
              s"took ${requestTime}ms"
          )

          result
        }
      }
    }
  }
}
