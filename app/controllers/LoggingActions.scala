package controllers

import play.api.mvc._
import scala.concurrent.Future
import play.Logger
import org.slf4j.MDC


// import MDCExecutionContext.ec

// trait LoggingActions {
//   object LoggingAction extends ActionBuilder[Request] {
//     def invokeBlock[A](request: Request[A], block: (Request[A]) => Future[Result]) = {
//       val headers = request.headers.getAll(LoggingContext.LOGGING_CONTEXT_HEADER)
//         // TODO - !! just reading the first header for now
//         .headOption.map(LoggingContext.fromHeader(_)).getOrElse(Map.empty[String, String])

//       Logger.info(s"LoggingAction invokeBlock [$headers]")

//       LoggingContext.withContext(headers) {
//         // execute the original block to generate the original
//         // response ...
//         block(request)
//           // ... and then wrap its response with the (possibly
//           // updated) MDC response header
//           .map(_.withHeaders(LoggingContext.headerMap.toSeq: _*))
//       }
//     }
//   }
// }
