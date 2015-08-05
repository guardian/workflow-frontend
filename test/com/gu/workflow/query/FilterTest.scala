package com.gu.workflow.query

import lib.PostgresDB
import models.{Status, ContentItem, DashboardRow}
import org.joda.time.DateTime
import org.scalatest.Matchers
import org.scalatest.matchers.{Matcher, MatchResult}
import models.ContentItem._
import scala.language.implicitConversions

object FilterTestOps extends Matchers {

  type Content = List[ContentItem]
  type FieldTest = ContentItem => Boolean

  implicit def operators[A](t: FieldTest) = FilterTestOps(t)

  val noFilter: FieldTest = _ => true

  def statusCheck(s: String): FieldTest  = c => status(c) == Some(Status(s))

  def fieldCheck[A](f: ContentItem => A, a: A): ContentItem => Boolean = c => f(c) == a
  def fieldOptCheck[A](f: ContentItem => Option[A], a: A): ContentItem => Boolean = c => f(c) == Some(a)

  def dateRange(f: ContentItem => DateTime, dt: DateRange): FieldTest = c => (f(c) isAfter dt.from) && (f(c) isBefore dt.until)

  //todo - abstract the boolean operation repition
  def dateRangeOpt(f: ContentItem => Option[DateTime], dt: DateRange): FieldTest = { c=>
    f(c) match {
      case Some(v) => (v isAfter dt.from) && (v isBefore dt.until)
      case None => false
    }
  }

  val writers: FieldTest = statusCheck("Writers")
  val desk: FieldTest = statusCheck("Desk")
  val subs: FieldTest = statusCheck("Subs")
  val prodEd: FieldTest = statusCheck("Production Editor")
  val revise: FieldTest = statusCheck("Revise")
  val `final`: FieldTest = statusCheck("Final")
  val hold: FieldTest = statusCheck("Hold")



  val dateFields: DateRange => FieldTest = { dt =>
    dateRange(stubLastMod, dt) |
    dateRange(createdAt, dt) |
      dateRangeOpt(due, dt) |
    dateRangeOpt(wcLastMod, dt) |
    dateRangeOpt(timePublished, dt) |
    dateRangeOpt(takenDown, dt) |
    dateRangeOpt(embargoedUntil, dt) |
    dateRangeOpt(scheduledLaunch, dt)

  }

  def or(a: FieldTest, b: FieldTest): FieldTest = (c) => a(c) || b(c)

  case class FilterTestOps(t1: FieldTest) {
    def |(t2: FieldTest) = or(t1,t2)

  }

  case class FilterTest(p: (ContentItem) => Boolean, testData: Content) {
    val splitTestData = testData.partition(p)

    def compareTo(dbResult: DBResult): Boolean = {
      val (testIn, testOut) = splitTestData
      (dbResult.results sameElements testIn) && (dbResult.rest sameElements testOut)
    }
    //todo - figure out a way of printing the db filter and scala filter as part of debugging
    def matchWith(query: WfQuery): MatchResult = {
      def prettyPrint(items: Content): String = items.map(_.stub.id).mkString(",")
      val dbResult = DBResult(query, testData)
      val (testIn, testOut) = splitTestData
      MatchResult(
        compareTo(dbResult),
        s"Result from database (${prettyPrint(dbResult.results)} did not contain expected " +
          s"elements (${prettyPrint(testIn)})",
        s"Result from database (${dbResult.results}) contained unexpected elements (" +
          testIn diff dbResult.results + ")"
      )
    }
  }

  case class DBResult(query: WfQuery, inputData: Content) {
    val results = PostgresDB.getContent(query).map(DashboardRow.toContentItem(_))
    val rest = inputData diff results
  }

  class DBResultMatcher(filterTest: FilterTest) extends Matcher[WfQuery] {
    def apply(query: WfQuery) = filterTest.matchWith(query)
  }

  def selectSameResultsAs(filterTest: FilterTest) = new DBResultMatcher(filterTest)

}
