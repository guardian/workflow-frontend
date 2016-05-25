package com.gu.workflow.query

sealed trait ContentState { def name: String }
case object PublishedState extends ContentState { val name = "published" }
case object TakenDownState extends ContentState { val name = "takendown" }
case object ScheduledState extends ContentState { val name = "scheduled" }
case object EmbargoedState extends ContentState { val name = "embargoed" }
case object DraftState     extends ContentState { val name = "draft"     }
case class UnknownState(name: String) extends ContentState
