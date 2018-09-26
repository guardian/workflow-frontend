package com.gu.workflow.lib

import com.gu.workflow.api.SubscriptionsAPI
import org.slf4j.LoggerFactory

class Notifier(subs: SubscriptionsAPI) {
  private val logger = LoggerFactory.getLogger(this.getClass)

  def run(): Unit = {
    // TODO MRB: build the notifier
    //  Foreach subscription, load content, compare with previous, fire notifications, save seen ids
    //  groupby queryId to minimise load on workflow DB
    //  Remove subscription if notification fails to send

    // TODO MRB: fix logging
    //  This statement does not log locally :(
    //  The lambda will also need a logback.xml and possibly even logback itself?
    logger.info("I am the Workflow notifier!")
  }
}
