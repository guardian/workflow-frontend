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

  /**
    * In order to perform a test on a field, we have two stages:
    * Getting the field, and testing it. We split this out so that
    * they can be re-used in different combinations.
    */

  /**
    * First, we need to indicate which field we are testing. This is
    * represented by the type `FieldGetter[A]` which takes a content
    * item and returns the value of the field, which is of type `A`.
    */

  type FieldGetter[A] = (ContentItem) => A

  /**
    * We then represent the actual check that we want to make. This
    * represented by `DataTest[A]` and it takes a value of type `A`
    * (e.g. the value from of a field returned by one of the getters
    * above) and returns a `Boolean`, indicating whether this field is
    * a match or not.
    */

  type DataTest[A] = (A) => Boolean

  /**
    * When these are combined, we end up with a test which will take a
    * `ContentItem` and return a `Boolean` describing whether or not
    * it is a match for the filter being recreated.
    */

  // TODO => should this be called FilterTest?
  type FieldTest = (ContentItem) => Boolean

  def fieldTest[A](getter: FieldGetter[A], test: DataTest[A]): FieldTest = getter andThen test

  /**
    * We can then provide some useful combinators which will build
    * upon the basic logic represented by one of types above and apply
    * it to more complicated situations.
    */

  /**
    * Apply a normal test to an optional field, by first checking
    * whether or not the optional field is present: if it is not, then
    * we return a negative match (i.e. false). If it is present, then
    * we extract the value and apply the DataTest to it.
    */

  def optTest[A](test: DataTest[A]): DataTest[Option[A]] = (opt: Option[A]) => opt.map(test(_)).getOrElse(false)

  /**
    * And now we can create some generic types of test.
    */

  def stringContains(pattern: String): DataTest[String] = _.toUpperCase.containsSlice(pattern.toUpperCase)

  def dateRange(dt: DateRange): DataTest[DateTime] = d => (d isAfter dt.from) && (d isBefore dt.until)

  def eq[A](attr: A): DataTest[A] = a => a == attr

  def statusTest(str: String): DataTest[Status] = st => Status(str) === st

  implicit def operators[A](t: FieldTest) = FilterTestOps(t)

  val noFilter: FieldTest = _ => true
  val noResults: FieldTest = _ => false

  def statusCheck(s: String): FieldTest  = c => status(c) == Some(Status(s))

  def fieldCheck[A](f: ContentItem => A, a: A): ContentItem => Boolean = c => f(c) == a
  def fieldOptCheck[A](f: ContentItem => Option[A], a: A): ContentItem => Boolean = c => f(c) == Some(a)

  lazy val isVisible: ContentItem => Boolean = c => c.wcOpt.exists(wc => visibleOnUi(c.stub, wc))
  lazy val notTrashed: ContentItem => Boolean = c => !c.stub.trashed

  def or(a: FieldTest, b: FieldTest): FieldTest = (c) => a(c) || b(c)

  case class FilterTestOps(t1: FieldTest) {
    def |(t2: FieldTest) = or(t1,t2)
  }

  case class FilterTest(p: (ContentItem) => Boolean,
                        testData: Content,
                        globalFilter: ContentItem=>Boolean = c => isVisible(c) && notTrashed(c)) {

    val filteredData = testData.filter(globalFilter)
    val splitTestData = filteredData.partition(p)

    def compareTo(dbResult: DBResult): Boolean = {

      implicit val contentItemOrder =
        Ordering.by((c: ContentItem) => c.stub.id.getOrElse(-1L))

      val (testIn, testOut) = splitTestData
      (dbResult.results.sorted sameElements testIn.sorted) &&
      (dbResult.rest.sorted sameElements testOut.sorted)
    }
    //todo - figure out a way of printing the db filter and scala filter as part of debugging
    def matchWith(query: WfQuery): MatchResult = {
      def prettyPrint(items: Content): String = {
        val ids = items.map(_.stub.id.map(_.toString).getOrElse("?"))
        "ids:" + (if(ids.length > 0) ids.mkString(",") else "<empty>")
      }
      val dbResult = DBResult(query, filteredData)
      val (testIn, testOut) = splitTestData
      MatchResult(
        compareTo(dbResult),
        s"Result from database (in:${prettyPrint(dbResult.results)}, out:${prettyPrint(dbResult.rest)}) did not contain expected " +
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
