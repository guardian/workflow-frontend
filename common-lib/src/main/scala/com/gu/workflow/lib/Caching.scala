package com.gu.workflow.lib

import scalacache._
import caffeine._
import scalacache.serialization.InMemoryRepr

trait Caching {
  implicit val scalaCache: ScalaCache[InMemoryRepr] = ScalaCache(CaffeineCache())
}