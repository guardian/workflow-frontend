package lib

import com.gu.workflow.util.LoggingContext
import org.apache.pekko.stream.Materializer
import com.gu.pandahmac.HMACHeaderNames
import play.api.{Logger, Logging}
import play.api.mvc._

import scala.concurrent.Future

class LoggingFilter(override val mat: Materializer) extends Filter with Logging {
  def apply(nextFilter: (RequestHeader) => Future[Result])(requestHeader: RequestHeader): Future[Result] = {
    val ec = scala.concurrent.ExecutionContext.Implicits.global

    val startTime = System.currentTimeMillis

    val loggingContextMarkers = requestHeader.headers.getAll(LoggingContext.LOGGING_CONTEXT_HEADER)
      .flatMap(LoggingContext.fromHeader)
      .toMap
    val pandaHmacServiceNameMarkers =
      requestHeader.headers.get(HMACHeaderNames.serviceNameKey).map(HMACHeaderNames.serviceNameKey -> _).toMap

    LoggingContext.withContext(loggingContextMarkers ++ pandaHmacServiceNameMarkers) {
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
