package lib

import com.gu.workflow.util.LoggingContext
import akka.stream.Materializer
import play.api.{Logger, Logging}
import play.api.mvc._

import scala.concurrent.Future

class LoggingFilter(override val mat: Materializer) extends Filter with Logging {
  def apply(nextFilter: (RequestHeader) => Future[Result])(requestHeader: RequestHeader): Future[Result] = {
    val ec = scala.concurrent.ExecutionContext.Implicits.global

    val startTime = System.currentTimeMillis
    val headers = requestHeader.headers.getAll(LoggingContext.LOGGING_CONTEXT_HEADER)
      .map(LoggingContext.fromHeader)
      .fold(Map.empty[String, String])(_ ++ _)

    LoggingContext.withContext(headers) {
      LoggingContext.withMDCExecutionContext(ec) { implicit ec =>
        // use an new implicit execution context that will stash the
        // current MDC, and then apply to all threads that are
        // associated with this request

        nextFilter(requestHeader).map { result =>
          val endTime = System.currentTimeMillis
          val requestTime = endTime - startTime

          logger.info(
            s"(${result.header.status}) ${requestHeader.method} ${requestHeader.uri} " +
              s"took ${requestTime}ms"
          )

          result
        }
      }
    }
  }
}
