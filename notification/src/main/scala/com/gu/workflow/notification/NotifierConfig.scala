package com.gu.workflow.notification

import com.typesafe.config.{Config, ConfigFactory}

// TODO MRB: download and read config when running in AWS
class NotifierConfig(config: Config = ConfigFactory.load()) {
  lazy val apiUrl: String = config.getString("api.url")
  lazy val webPushPublicKey: String = config.getString("webpush.publicKey")
  lazy val webPushPrivateKey: String = config.getString("webpush.privateKey")
}
