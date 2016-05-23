package com.gu.workflow.lib

import org.joda.time.{DateTime, Duration}

object Util {

  def roundDateTime(t: DateTime, d: Duration = Duration.standardMinutes(5)) = {
    t minus (t.getMillis - (t.getMillis.toDouble / d.getMillis).round * d.getMillis)
  }
}
