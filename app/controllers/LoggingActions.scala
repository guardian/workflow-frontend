package controllers

import com.gu.workflow.util.LoggingContext
import play.api.mvc._
import scala.concurrent.Future
import play.Logger
import scala.concurrent.ExecutionContext
import org.slf4j.MDC

trait LoggingActions {

  implicit val ec = new ExecutionContext {
    /* should this be defined as a value somewhere, e.g in PrototypeConfig object? */
    val ec = scala.concurrent.ExecutionContext.Implicits.global

    def runHook(r: Runnable)(before: () => Unit)(after: () => Unit = () => ()) = new Runnable {
      def run: Unit = { before(); r.run(); after(); }
    }

    def execute(r: Runnable) = {
      // save the MDC in the current thread ...
      val savedMDC = MDC.getCopyOfContextMap()
      Logger.info("outer thread" + savedMDC)
      val withHook = runHook(r) { () =>
        Logger.info("inner thread" + savedMDC)
        // ... and then restore within this thread once it has taken
        // over
        if(savedMDC == null) MDC.clear() else MDC.setContextMap(savedMDC)
      } { () =>
        MDC.clear()
      }
      ec.execute(withHook)
    }

    def reportFailure(t: Throwable) = ec.reportFailure(t)
  }

  object LoggingAction extends ActionBuilder[Request] {
    def invokeBlock[A](request: Request[A], block: (Request[A]) => Future[Result]) = {
      val headers = request.headers.getAll(LoggingContext.LOGGING_CONTEXT_HEADER)
        .headOption.map(LoggingContext.fromHeader(_))
      Logger.info(s"headers: ${headers}")
      block(request)
    }
  }

}
