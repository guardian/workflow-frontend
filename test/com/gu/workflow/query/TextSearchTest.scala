package com.gu.workflow.query

// import lib.PostgresDB
import java.util.Random
import org.joda.time.DateTime
import test._
//import models._
import org.scalatest.{Matchers, FreeSpec}
// import FilterTestOps._
// import ContentItem._


object RandomUtil {
  // this should be in Config
  private val randomSeed = Option(System.getenv("RANDOM_SEED"))
    .map(_.toLong)
    .getOrElse(1L)

  private val textLookup = ('A' to 'Z').toVector
  def randomChar(implicit r: Random): Char = textLookup(Math.abs(r.nextInt) % textLookup.length)

  val defaultRandom = new Random(randomSeed)
  def randomText(len: Int = 10)(implicit r: Random) = Vector.fill(len)(randomChar).mkString("")

}

class TextSearchTest extends FreeSpec with WorkflowIntegrationSuite with Matchers {
  import RandomUtil._
  implicit val random = RandomUtil.defaultRandom

  "TextSearch" - {
    "random test" - {
      val str = randomText(10)
      println(s"I randomly generated: ${str}")
    }
  }

}
