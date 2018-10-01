package com.gu.workflow.notification

import java.security.Security

import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import com.gu.workflow.api.SubscriptionsAPI
import org.bouncycastle.jce.provider.BouncyCastleProvider

class NotificationLambda extends RequestHandler[Unit, Unit] {
  private val stage = sys.env("STAGE")

  private val s3Client = AmazonS3ClientBuilder.standard().build()
  private val config = NotifierConfig(stage, s3Client)

  Security.addProvider(new BouncyCastleProvider())

  private val subsApi = new SubscriptionsAPI(stage, config.webPushPublicKey, config.webPushPrivateKey)
  private val notifier = new Notifier(stage, subsApi)

  override def handleRequest(input: Unit, context: Context): Unit = {
    notifier.run()
  }
}