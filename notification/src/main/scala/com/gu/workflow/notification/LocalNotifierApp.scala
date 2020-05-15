package com.gu.workflow.notification

import com.gu.workflow.api.SubscriptionsAPI
import com.gu.workflow.util.Stage
import org.bouncycastle.jce.provider.BouncyCastleProvider

object LocalNotifierApp extends App {
  val stage: Stage = Stage(sys.env.getOrElse("STAGE", "DEV"))
  val config = new NotifierConfig()

  import java.security.Security

  Security.addProvider(new BouncyCastleProvider())

  val subsApi = new SubscriptionsAPI(stage, config.webPushPublicKey, config.webPushPrivateKey)
  val notifier = new Notifier(stage, config.sharedSecret, subsApi)

  notifier.run()
}
