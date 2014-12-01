import lib.AWSWorkflowQueue
import models.{Status, WireStatus, LifecycleEvent, WorkflowNotification}

import org.joda.time.DateTime
import org.scalatest.{FunSpec, ShouldMatchers}

import lib.ResourcesHelper
import play.api.libs.json._

import com.amazonaws.services.sqs.model._


class AWSWorkflowQueueSpec extends FunSpec with ShouldMatchers with ResourcesHelper{
  def resource(r: String): String = {
    slurp(r).getOrElse(throw new RuntimeException("could not find test resource"))
  }

  def msg(fixtureId: String): Message = {
    (new Message).withBody(resource(s"$fixtureId.json"))
  }

  describe("AWSWorkflowQueue") {
    describe(".parseMessage") {
      it("should parse a valid wirestatus message") {
        val result = AWSWorkflowQueue.parseMessage(msg("sqs-full-wirestatus-change"))
        val expectedResult = Some(WireStatus(
          "546df848aa248d0c8b6e2f2e", 
          Some("global/2014/nov/20/546df848aa248d0c8b6e2f2e"), 
          Some("foo"),
          "article",
          "field",
          false,
          Some("Robert Kenny"),
          new DateTime("2014-11-20T14:19:56.840Z"),
          List(),
          Status("Writers"),
          false,
          None,
          None,
          6.toLong,
          "live",
          None
        ))
    
        result should equal(expectedResult) 
      }

      it("should parse a valid lifecycle message") {
        val result = AWSWorkflowQueue.parseMessage(msg("sqs-full-lifecycle-delete"))
        val expectedResult = Some(LifecycleEvent(
          "546dcf3eb0c6c8508a6990e0", 
          false, 
          "delete", 
          new DateTime("2014-11-20T11:23:54.004Z") 
        ))
    
        result should equal(expectedResult) 
      }

      it("should return None when no valid message") {
        val result = AWSWorkflowQueue.parseMessage(msg("sqs-full-badmessage"))
        val expectedResult = None    
        result should equal(expectedResult) 
      }
    }
  }
}
