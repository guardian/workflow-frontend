package com.gu.workflow.notification

import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}

class NotificationLambda extends RequestHandler[Unit, Unit] {
  override def handleRequest(input: Unit, context: Context): Unit = {

  }
}