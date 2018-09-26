package com.gu.workflow.notification

import com.gu.workflow.api.SubscriptionsAPI
import org.bouncycastle.jce.provider.BouncyCastleProvider

object LocalNotifierApp extends App {
  import scala.concurrent.ExecutionContext.Implicits.global

  val stage = sys.env.getOrElse("STAGE", "DEV")
  val config = new NotifierConfig()

  import java.security.Security

  Security.addProvider(new BouncyCastleProvider())

  val subsApi = new SubscriptionsAPI(stage, config.webPushPublicKey, config.webPushPrivateKey)
  val notifier = new Notifier(config.apiUrl, subsApi)

  notifier.run()
}
