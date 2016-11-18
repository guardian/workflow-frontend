package com.gu.workflow.test

import java.util.Date
import com.amazonaws.auth.{BasicAWSCredentials, AWSCredentials}
import com.gu.pandomainauth.PanDomainAuth
import com.gu.pandomainauth.model.{User, AuthenticatedUser}
import com.gu.pandomainauth.service.CookieUtils


class PanDomainAuthService(pandaConfig: PandaConfig) extends PanDomainAuth {
  lazy val system    = pandaConfig.system
  lazy val domain    = pandaConfig.domain

  lazy val awsKey    = pandaConfig.awsKey
  lazy val awsSecret = pandaConfig.awsSecret

  val oneDaysMillis: Long = 1000 * 60 * 60 * 24

  def generateCookie(pandaUser: PandaUser): String = {
    val authedUser = AuthenticatedUser(
      user = User(pandaUser.firstName, pandaUser.lastName, pandaUser.email, None),
      authenticatingSystem = system,
      authenticatedIn = Set(system),
      expires = new Date().getTime + oneDaysMillis,
      multiFactor = true
    )

    CookieUtils.generateCookieData(authedUser, settings.privateKey)
  }
}

case class PandaConfig(system: String, domain: String, awsKey: String, awsSecret: String)
case class PandaCookie(key: String, value: String)
case class PandaUser(email: String, firstName:String, lastName:String)

object PandaCookie {
  def apply(
    pandaUser: PandaUser,
    pandaConfig: PandaConfig
  ): PandaCookie  = {
    val panDomainAuthService = new PanDomainAuthService(pandaConfig)
    val cookieValue = panDomainAuthService.generateCookie(pandaUser)

    PandaCookie("gutoolsAuth", cookieValue)
  }
}
