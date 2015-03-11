package controllers

import play.api.mvc._
import scala.concurrent.Future
import play.Logger
import scala.concurrent.ExecutionContext

trait LoggingActions {

  implicit val ec = new ExecutionContext {
    val ec = scala.concurrent.ExecutionContext.Implicits.global
    def runHook(r: Runnable)(f: () => Unit) = new Runnable {
      def run: Unit = { f(); r.run(); }
    }
    def execute(r: Runnable) =
      ec.execute(runHook(r)(() => Logger.info("EC DONE IT")))

    def reportFailure(t: Throwable) = ec.reportFailure(t)
  }

}
