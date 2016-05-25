package com.gu.workflow.test


object Config {

  val randomSeed: Option[Long] = sys.env.get("WF_RANDOM_SEED").map(_.toLong)
}
