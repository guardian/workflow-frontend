package com.gu.workflow.notification

import java.io.InputStreamReader

import com.amazonaws.services.s3.AmazonS3
import com.typesafe.config.{Config, ConfigFactory}

class NotifierConfig(config: Config = ConfigFactory.load()) {
  lazy val apiUrl: String = config.getString("api.url")
  lazy val webPushPublicKey: String = config.getString("webpush.publicKey")
  lazy val webPushPrivateKey: String = config.getString("webpush.privateKey")
}

object NotifierConfig {
  def apply(stage: String, s3Client: AmazonS3): NotifierConfig = {
    val key = s"$stage/workflow-frontend/application.defaults.conf"
    val obj = s3Client.getObject("workflow-private", key)

    val config = ConfigFactory.parseReader(new InputStreamReader(obj.getObjectContent))
    new NotifierConfig(config)
  }
}