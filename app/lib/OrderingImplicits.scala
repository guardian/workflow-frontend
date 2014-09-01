package lib

import org.joda.time.DateTime

import scala.math.Ordering

object OrderingImplicits {
  implicit val jodaDateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)

  implicit def nonesLast[T](implicit ord: Ordering[T]): Ordering[Option[T]] = new Ordering[Option[T]] {
    override def compare(x: Option[T], y: Option[T]) = (x, y) match {
      case (None, None)       => 0
      case (None, _)          => 1
      case (_, None)          => -1
      case (Some(x), Some(y)) => ord.compare(x, y)
    }
  }

  implicit val unpublishedOrdering: Ordering[(Int, Option[DateTime])] = {
    Ordering.Tuple2(Ordering.Int.reverse, Ordering.Option(jodaDateTimeOrdering.reverse))
  }

  implicit val publishedOrdering: Ordering[(Option[DateTime], DateTime)] = {
    Ordering.Tuple2(nonesLast(jodaDateTimeOrdering.reverse), jodaDateTimeOrdering.reverse)
  }
}
