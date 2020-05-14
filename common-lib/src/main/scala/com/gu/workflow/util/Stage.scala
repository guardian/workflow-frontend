package com.gu.workflow.util

sealed trait Stage {
  def name: String = this match {
    case Prod => "PROD"
    case Code => "CODE"
    case Dev => "DEV"
  }

  def appDomain: String = this match {
    case Prod => "gutools.co.uk"
    case Code => "code.dev-gutools.co.uk"
    case Dev => "local.dev-gutools.co.uk"
  }

  override def toString: String = name
}

object Stage {
  def apply(value: String): Stage = value.toUpperCase match {
    case "PROD" => Prod
    case "CODE" => Code
    case "DEV" => Dev
    case other => throw new IllegalStateException(s"invalid stage: $other")
  }
}

object Prod extends Stage
object Code extends Stage
object Dev extends Stage
