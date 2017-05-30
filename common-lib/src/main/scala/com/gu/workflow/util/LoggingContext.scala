package com.gu.workflow.util

import org.slf4j.MDC
import play.Logger

import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext
import scala.util.control.NonFatal

/*
 * This is a lightweight wrapper around the MDC stuff. It provides
 * some helpful methods for serialising to an HTTP header and doesn't
 * have such a forgettable or meaningless name.
 *
 *  This workflow instance was borrowed from Flexible Content's equivalent
 */

object LoggingContext {
  val LOGGING_CONTEXT_HEADER = "X-GU-LoggingContext"

  def get(key:String) = Option(MDC.get(key))
  def put(key:String, value:Option[String]) =
    if (value.nonEmpty) MDC.put(key,value.get) else MDC.remove(key)
  def put(key:String, value:String) = MDC.put(key,value)
  def remove(key:String) = MDC.remove(key)
  def clear() = MDC.clear()

  def withContext[T](key:String, value:Option[String])(block: => T): T = {
    val oldValue = get(key)
    put(key, value)
    try block
    finally put(key, oldValue)
  }

  def withContext[T](context:Map[String,String])(block: => T): T = {
    context.foreach { case (k,v) => put(k,v) }
    try block
    finally context.keys.foreach { k => remove(k) }
  }

  def headerValue(context: Map[String,String]): Option[String] =
    if (context.nonEmpty) Some(context.map { case (key, value) => s"$key=$value"}.mkString("; "))
    else None

  def headerMap(context: Map[String,String]): Map[String, String] =
    headerValue(context).map(LOGGING_CONTEXT_HEADER -> _).toMap

  def headerMap: Map[String, String] = {
    val map = Option(MDC.getCopyOfContextMap).
      map(_.asScala.toMap).
      getOrElse(Map.empty)
    headerMap(map)
  }

  def fromHeader(header: String): Map[String, String] =
    try {
      header.split(";").map{ _.trim.split("=", 2) }.map{c => c(0) -> c(1)}.toMap
    } catch {
      case NonFatal(e) =>
        Logger.warn(s"Couldn't parse logging context header (returning empty map): $header", e)
        Map.empty
    }

  def withMDCExecutionContext[A](delegate: ExecutionContext)(f: (ExecutionContext) => A): A = {
    val savedMDC = MDC.getCopyOfContextMap
    val ec = new ExecutionContext {
      def runHook(r: Runnable)(before: () => Unit)(after: () => Unit = () => ()) = new Runnable {
        def run: Unit = { before(); r.run(); after(); }
      }

      def execute(r: Runnable) = {
        val withHook = runHook(r) { () =>
          // ... and then restore within this thread once it has taken
          // over
          if(savedMDC == null) MDC.clear() else MDC.setContextMap(savedMDC)
        } { () =>
          MDC.clear()
        }
        delegate.execute(withHook)
      }
      def reportFailure(t: Throwable) = delegate.reportFailure(t)
    }
    f(ec)
  }
}
