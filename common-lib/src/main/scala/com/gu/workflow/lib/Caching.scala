package com.gu.workflow.lib

import scalacache._
import caffeine._

trait Caching {
  implicit val scalaCache = ScalaCache(CaffeineCache())
}